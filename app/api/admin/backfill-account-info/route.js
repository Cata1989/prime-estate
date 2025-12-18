import connectDB from '@/config/database';
import Property from '@/models/Property';
import User from '@/models/User';
import { getSessionUser } from '@/utils/getSessionUser';

export const POST = async () => {
  try {
    await connectDB();

    const session = await getSessionUser();
    if (!session || !session.userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const props = await Property.find({
      $or: [{ account_info: { $exists: false } }, { account_info: null }],
    })
      .select('_id owner')
      .lean();

    if (!props.length) {
      return new Response(
        JSON.stringify({ updated: 0, message: 'Nothing to backfill' }),
        { status: 200 }
      );
    }

    const ownerIds = [
      ...new Set(props.map((p) => String(p.owner)).filter(Boolean)),
    ];
    const users = await User.find({ _id: { $in: ownerIds } })
      .select('username email image')
      .lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));

    const ops = props.map((p) => {
      const u = byId.get(String(p.owner));
      return {
        updateOne: {
          filter: { _id: p._id },
          update: {
            $set: {
              account_info: u
                ? {
                    username: u.username || '',
                    email: u.email || '',
                    image: u.image || '',
                  }
                : null,
            },
          },
        },
      };
    });

    await Property.bulkWrite(ops);

    return new Response(JSON.stringify({ updated: ops.length }), {
      status: 200,
    });
  } catch (e) {
    console.log(e);
    return new Response('Error', { status: 500 });
  }
};
