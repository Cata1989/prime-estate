import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/authOptions';
import connectDB from '@/config/database';
import Conversation from '@/models/Conversation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async () => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return new Response('Unauthorized', { status: 401 });

    await connectDB();

    const convs = await Conversation.find({ participants: session.user.id })
      .sort({ lastMessageAt: -1 })
      .lean();

    return new Response(JSON.stringify(convs), { status: 200 });
  } catch {
    return new Response(
      JSON.stringify({ error: 'Error listing conversations' }),
      { status: 500 }
    );
  }
};
