import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/authOptions';
import connectDB from '@/config/database';
import SessionLog from '@/models/SessionLog';
import { broadcastPresence } from '@/lib/presenceBus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (req) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await connectDB();

    const { sessionLogId } = await req.json();
    if (!sessionLogId) {
      return new Response(
        JSON.stringify({ error: 'Missing sessionLogId' }),
        { status: 400 }
      );
    }

    const log = await SessionLog.findById(sessionLogId);
    if (log && !log.logoutAt) {
      const now = new Date();
      const durationSeconds = Math.floor((now - log.loginAt) / 1000);
      log.logoutAt = now;
      log.durationSeconds = durationSeconds;
      await log.save();

      broadcastPresence({ userId: log.user.toString(), online: false });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    console.error('custom-logout error', e);
    return new Response(JSON.stringify({ error: 'Logout failed' }), {
      status: 500,
    });
  }
};