import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/authOptions';
import connectDB from '@/config/database';
import { addPresenceClient, removePresenceClient } from '@/lib/presenceBus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async (req) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  await connectDB();

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();

      const client = addPresenceClient(controller);

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(enc.encode(': ping\n\n'));
        } catch {
          // ignore
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        removePresenceClient(client);
        try {
          controller.close();
        } catch {
          // ignore
        }
      });

      controller.enqueue(enc.encode('event: ready\ndata: "ok"\n\n'));
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
};