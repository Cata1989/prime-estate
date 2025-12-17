import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/authOptions';
import connectDB from '@/config/database';
import ChatMessage from '@/models/ChatMessage';
import Conversation from '@/models/Conversation';
import mongoose from 'mongoose';
import { pusherServer } from '@/lib/pusherServer';
import { getPresenceMembers } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async (_req, { params }) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const conversationId = params.conversationId;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return new Response(
        JSON.stringify({ error: 'ID invalid' }),
        { status: 400 }
      );
    }

    await connectDB();

    const conv = await Conversation.findById(conversationId).lean();
    if (
      !conv ||
      !conv.participants.map(String).includes(session.user.id)
    ) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403 }
      );
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
  } catch (e) {
    console.error('GET /api/chat/messages/[conversationId] error', e);
    return new Response(
      JSON.stringify({ error: 'Eroare listare mesaje' }),
      { status: 500 }
    );
  }
};

// POST – send message + update unread based on presence
export const POST = async (req, { params }) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const conversationId = params.conversationId;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return new Response(
        JSON.stringify({ error: 'ID invalid' }),
        { status: 400 }
      );
    }

    const { text } = await req.json();
    if (!text || !text.trim()) {
      return new Response(
        JSON.stringify({ error: 'Empty message' }),
        { status: 400 }
      );
    }

    await connectDB();

    const conv = await Conversation.findById(conversationId).lean();
    if (
      !conv ||
      !conv.participants.map(String).includes(session.user.id)
    ) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403 }
      );
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

    const senderId = session.user.id.toString();
    const participants = (conv.participants || []).map(String);
    const recipients = participants.filter((id) => id !== senderId);

    if (recipients.length > 0) {

      let activeUserIds = new Set();
      try {
        const presenceChannelName = `presence-conversation-${conversationId}`;
        const members = await getPresenceMembers(presenceChannelName);
        activeUserIds = new Set(members.map((m) => m.id.toString()));
      } catch (e) {
        console.error('Error reading presence members', e);
      }

      const incObj = recipients.reduce((acc, rid) => {
        const isActive = activeUserIds.has(rid);
        if (!isActive) {
          acc[`unreadByUser.${rid}`] = 1;
        }
        return acc;
      }, {});

      if (Object.keys(incObj).length > 0) {
        await Conversation.updateOne(
          { _id: conversationId },
          { $inc: incObj }
        );

        const convAfter = await Conversation.findById(conversationId).lean();
        const unreadByUserAfter = convAfter.unreadByUser || {};

        for (const rid of recipients) {
          const isActive = activeUserIds.has(rid);
          if (isActive) continue;

          let unreadCount = 0;
          if (typeof unreadByUserAfter.get === 'function') {
            unreadCount = unreadByUserAfter.get(rid) || 0;
          } else if (typeof unreadByUserAfter === 'object') {
            unreadCount = unreadByUserAfter[rid] || 0;
          }

          await pusherServer.trigger(
            `user-${rid}`,
            'unread-updated',
            {
              otherUserId: senderId,
              unreadCount,
            }
          );
        }
      }
    }

    await pusherServer.trigger(
      `conversation-${conversationId}`,
      'message-created',
      payload
    );

    return new Response(JSON.stringify(payload), { status: 201 });
  } catch (err) {
    console.error(
      'POST /api/chat/messages/[conversationId] error:',
      err
    );
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500 }
    );
  }
};