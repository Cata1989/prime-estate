import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/authOptions';
import connectDB from '@/config/database';
import Conversation from '@/models/Conversation';
import mongoose from 'mongoose';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async (req) => {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('conversationId');

  if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
    return new Response('Missing/invalid conversationId', { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  await connectDB();

  const conv = await Conversation.findById(conversationId).lean();
  if (!conv || !conv.participants.map(String).includes(session.user.id)) {
    return new Response('Forbidden', { status: 403 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();

      const col = mongoose.connection.collection('chatmessages');
      const pipeline = [
        { $match: { 'fullDocument.conversationId': conversationId } },
      ];
      const cs = col.watch(pipeline, { fullDocument: 'updateLookup' });

      const push = (obj) => {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      cs.on('change', async (ch) => {
        if (ch.operationType === 'insert') {
          const d = ch.fullDocument;

          let senderName = 'Unknown';
          try {
            const u = await User.findById(d.sender).select('username').lean();
            if (u?.username) senderName = u.username;
          } catch (e) {
            console.error('Error fetching senderName', e);
          }

          push({
            _id: d._id,
            conversationId: d.conversationId,
            sender: d.sender,
            senderName,    
            text: d.text,
            createdAt: d.createdAt,
          });
        }
      });

      cs.on('error', (err) => {
        controller.enqueue(
          enc.encode(
            `event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`
          )
        );
      });

      const heartbeat = setInterval(() => {
        controller.enqueue(enc.encode(': ping\n\n'));
      }, 15000);

      req.signal.addEventListener('abort', async () => {
        clearInterval(heartbeat);
        try {
          await cs.close();
        } catch {}
        controller.close();
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