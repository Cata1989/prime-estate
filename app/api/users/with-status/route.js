import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import connectDB from "@/config/database";
import User from "@/models/User";
import SessionLog from "@/models/SessionLog";
import Conversation from "@/models/Conversation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async () => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) { 
            return new Response("Unauthorized", { status: 401 });
        }

        // define currentUserId
        const currentUserId = session.user.id.toString();

        await connectDB();

        const users = await User.find({}, { username: 1, email: 1 })
            .sort({ username: 1 })
            .lean();

        if (!users.length) {
            return new Response(JSON.stringify([]), { status: 200 });
        }

        const userIds = users.map((u) => u._id);

        const logs = await SessionLog.aggregate([
            { $match: { user: { $in: userIds } } },
            { $sort: { loginAt: -1 } },
            {
                $group: {
                    _id: '$user',
                    lastLoginAt: { $first: '$loginAt' },
                    lastLogoutAt: { $first: '$logoutAt' }, 
                    sessions: {
                        $push: {
                          loginAt: '$loginAt',
                          logoutAt: '$logoutAt',
                          durationSeconds: '$durationSeconds',
                          browser: '$browser',
                          userAgent: '$userAgent',
                        },
                    },
                },
            },
        ]);

        const byUserId = new Map(logs.map((l) => [l._id.toString(), l]));

        //all conversations where current user participates
        const convs = await Conversation.find({
            participants: currentUserId,
        }).lean();

        // map: otherUserId -> unreadCount for currentUserId
        const unreadMap = new Map();

        for (const conv of convs) {
            const participants = (conv.participants || []).map(String);
            const otherUserId = participants.find((id) => id !== currentUserId);
            if (!otherUserId) continue;
      
            const unreadByUser = conv.unreadByUser || {};
            let count = 0;
      
            if (typeof unreadByUser.get === 'function') {
              count = unreadByUser.get(currentUserId) || 0;
            } else if (typeof unreadByUser === 'object') {
              count = unreadByUser[currentUserId] || 0;
            }
      
            unreadMap.set(otherUserId, count);
        }

        // 3) build result with unreadCount
        const result = users.map((u) => {
            const id = u._id.toString();
            const log = byUserId.get(id);
            let online = false;
    
            if (log && !log.lastLogoutAt) {
            online = true;
            }
    
            return {
            _id: u._id,
            username: u.username,
            email: u.email,
            online,
            sessions: log?.sessions || [],
            unreadCount: unreadMap.get(id) || 0,
            };
        });

        return new Response(JSON.stringify(result), { status: 200 });
    } catch(e) {
        console.error('GET /api/users/with-status error', e);
        return new Response(JSON.stringify({ error: 'Failed to fetch users with status' }), { status: 500 });
    }
};