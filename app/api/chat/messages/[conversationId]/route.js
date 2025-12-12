import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/authOptions';
import connectDB from '@/config/database';
import ChatMessage from '@/models/ChatMessage';
import Conversation from '@/models/Conversation';
import mongoose from 'mongoose';
import { pusherServer } from '@/lib/pusherServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async (_req, { params }) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

    const conversationId = params.conversationId;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return new Response(JSON.stringify({ error: 'ID invalid' }), { status: 400 });
    }

    await connectDB();

    const conv = await Conversation.findById(conversationId).lean();
    if (!conv || !conv.participants.map(String).includes(session.user.id)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const msgs = await ChatMessage
      .find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(200)
      .populate('sender', 'username')
      .lean();

      const result = msgs.map((m) => ({
        _id: m._id.toString(),
        conversationId: m.conversationId.toString(),
        senderId: m.sender?._id?.toString?.() || m.sender?.toString?.() || '',
        senderName: m.sender?.username || 'Unknown',
        text: m.text,
        createdAt: m.createdAt,
      }));

    return new Response(JSON.stringify(result), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ error: 'Eroare listare mesaje' }), { status: 500 });
  }
};

// add POST method for sending with Pusher mechanism
export const POST = async (req, { params }) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

    const conversationId = params.conversationId;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return new Response(JSON.stringify({ error: 'ID invalid' }), { status: 400 });
    }

    const { text } = await req.json();
    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ error: 'Empty message' }), { status: 400 });
    }

    await connectDB();

    const conv = await Conversation.findById(conversationId).lean();
    if (!conv || !conv.participants.map(String).includes(session.user.id)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const msg = await ChatMessage.create({
      conversationId: new mongoose.Types.ObjectId(conversationId),
      sender: new mongoose.Types.ObjectId(session.user.id),
      text,
      createdAt: new Date(),
    });

    const populated = await ChatMessage.findById(msg._id)
      .populate('sender', 'username')
      .lean();

    const payload = {
      _id: populated._id.toString(),
      conversationId,
      senderId: session.user.id,
      senderName: populated.sender?.username || 'Unknown',
      text: populated.text,
      createdAt: populated.createdAt,
    };

    await pusherServer.trigger(
      `conversation-${conversationId}`,
      'message-created',
      payload
    );

    return new Response(JSON.stringify(payload), { status: 201 });
  } catch (err) {
    console.error('POST /api/chat/messages/[conversationId] error:', err);
    return new Response(JSON.stringify({ error: 'Eroare server' }), { status: 500 });
  }
};