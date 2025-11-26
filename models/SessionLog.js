import mongoose from 'mongoose';

const SessionLogSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        loginAt: { type: Date, required: true },
        logoutAt: { type: Date },
        durationSeconds: { type: Number },
    },
    { timestamps: true }
);

export default mongoose.models.SessionLog || mongoose.model('SessionLog', SessionLogSchema);