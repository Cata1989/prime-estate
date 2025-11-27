import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/authOptions';
import connectDB from '@/config/database';
import ChatMessage from '@/models/ChatMessage';
import Conversation from '@/models/Conversation';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async (_req, { params }) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new Response('Neautorizat', { status: 401 });

    const conversationId = params.conversationId;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return new Response(JSON.stringify({ error: 'ID invalid' }), { status: 400 });
    }

    await connectDB();

    const conv = await Conversation.findById(conversationId).lean();
    if (!conv || !conv.participants.map(String).includes(session.user.id)) {
      return new Response(JSON.stringify({ error: 'Interzis' }), { status: 403 });
    }

    const msgs = await ChatMessage
      .find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(200)
      .populate('sender', 'username')
      .lean();

    const shaped = msgs.map((m) => ({
        _id: m._id,
        conversationId: m.conversationId,
        text: m.text,
        createdAt: m.createdAt,
        sender: m.sender?._id || m.sender,
        senderName: m.sender?.username || 'Necunoscut',
    }));

    return new Response(JSON.stringify(shaped), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ error: 'Eroare listare mesaje' }), { status: 500 });
  }
};