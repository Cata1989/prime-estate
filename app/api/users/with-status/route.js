import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import connectDB from "@/config/database";
import User from "@/models/User";
import SessionLog from "@/models/SessionLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async () => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) { 
            return new Response("Unauthorized", { status: 401 });
        }

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

        const byUserId = new Map(
            logs.map((l) => [l._id.toString(), l])
        );

        const result = users.map((u) => {
            const log = byUserId.get(u._id.toString());
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
            };
        });

        return new Response(JSON.stringify(result), { status: 200 });
    } catch(e) {
        console.error('GET /api/users/with-status error', e);
        return new Response(JSON.stringify({ error: 'Failed to fetch users with status' }), { status: 500 });
    }
};