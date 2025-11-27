import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/authOptions';
import connectDB from '@/config/database';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async () => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response('Neautorizat', { status: 401 });
    }

    await connectDB();

    const users = await User.find({}, { username: 1, email: 1 })
      .sort({ username: 1 })
      .lean();

    return new Response(JSON.stringify(users), { status: 200 });
  } catch (e) {
    console.error('GET /api/users/list error', e);
    return new Response(JSON.stringify({ error: 'Eroare listare useri' }), {
      status: 500,
    });
  }
};