import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);