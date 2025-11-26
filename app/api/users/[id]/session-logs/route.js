import connectDB from "@/config/database";
import SessionLog from "@/models/SessionLog";

export const GET = async (_req, { params }) => {
    try {
        await connectDB();
        const logs = await SessionLog.find({ user: params.id }).sort({ loginAt: -1 }).lean();
        return new Response(JSON.stringify(logs), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed to fetch session logs' }), { status: 500 });   
    }
};