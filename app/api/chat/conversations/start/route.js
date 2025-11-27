import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/authOptions';
import connectDB from '@/config/database';
import Conversation from '@/models/Conversation';
import { participantsKeyFor } from '@/utils/conversation';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (req) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new Response('Neautorizat', { status: 401 });

    const { otherUserId } = await req.json();

    if (!otherUserId || !mongoose.Types.ObjectId.isValid(otherUserId)) {
      return new Response(JSON.stringify({ error: 'otherUserId invalid' }), { status: 400 });
    }
    if (otherUserId === session.user.id) {
      return new Response(JSON.stringify({ error: 'Nu poți începe conversație cu tine' }), { status: 400 });
    }

    await connectDB();

    const key = participantsKeyFor(session.user.id, otherUserId);

    let conv = await Conversation.findOne({ participantsKey: key });
    if (!conv) {
      conv = await Conversation.create({
        participants: [session.user.id, otherUserId],
        participantsKey: key,
        lastMessageAt: new Date(),
      });
    }

    return new Response(JSON.stringify({ conversationId: conv._id.toString() }), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ error: 'Eroare start conversatie' }), { status: 500 });
  }
};