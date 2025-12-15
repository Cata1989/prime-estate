import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }],
    participantsKey: { type: String, required: true, unique: true, index: true },
    lastMessageAt: { type: Date },
    // add unread count per user in this conversation
    unreadByUser: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);