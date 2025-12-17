import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/authOptions';
import connectDB from '@/config/database';
import ChatMessage from '@/models/ChatMessage';
import Conversation from '@/models/Conversation';
import mongoose from 'mongoose';
import ChatRoom from '@/components/ChatRoom';
import { pusherServer } from '@/lib/pusherServer';

export default async function ChatPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return <div>Unauthorized</div>;
  }

  const conversationId = params.conversationId;
  const currentUserId = session.user.id.toString();

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return <div>ID invalid</div>;
  }

  await connectDB();

  const conv = await Conversation.findById(conversationId).lean();
  if (!conv || !conv.participants.map(String).includes(currentUserId)) {
    return <div>Forbidden</div>;
  }

  // reset unread direct on this page ===
  await Conversation.updateOne(
    { _id: conversationId },
    { $set: { [`unreadByUser.${currentUserId}`]: 0 } }
  );

  const participants = conv.participants.map(String);
  const otherUserId = participants.find((pid) => pid !== currentUserId);

  if (otherUserId) {
    await pusherServer.trigger(
      `user-${currentUserId}`,
      'unread-updated',
      {
        otherUserId,
        unreadCount: 0,
      }
    );
  }

  const msgs = await ChatMessage
    .find({ conversationId })
    .sort({ createdAt: 1 })
    .limit(200)
    .populate('sender', 'username')
    .lean();

  const initialMessages = msgs.map((m) => ({
    _id: m._id.toString(),
    conversationId: m.conversationId.toString(),
    senderId: m.sender?._id?.toString?.() || m.sender?.toString?.() || '',
    senderName: m.sender?.username || 'Unknown',
    text: m.text,
    createdAt: m.createdAt,
  }));

  return (
    <div className="max-w-2xl mx-auto mt-6">
      <ChatRoom
        conversationId={conversationId}
        initialMessages={initialMessages}
      />
    </div>
  );
}