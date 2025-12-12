import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/authOptions';
import connectDB from '@/config/database';
import ChatMessage from '@/models/ChatMessage';
import Conversation from '@/models/Conversation';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (req) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

    const { conversationId, text } = await req.json();

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId) || !text?.trim()) {
      return new Response(JSON.stringify({ error: 'Invalid date' }), { status: 400 });
    }

    await connectDB();

    const conv = await Conversation.findById(conversationId).lean();
    if (!conv || !conv.participants.map(String).includes(session.user.id)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const msg = await ChatMessage.create({
      conversationId,
      sender: session.user.id,
      text: text.trim(),
    });

    await Conversation.findByIdAndUpdate(conversationId, { lastMessageAt: new Date() });

    return new Response(JSON.stringify(msg), { status: 201 });
  } catch {
    return new Response(JSON.stringify({ error: 'Error sending' }), { status: 500 });
  }
};