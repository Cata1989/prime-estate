import connectDB from '@/config/database';
import User from '@/models/User';

import GoogleProvider from 'next-auth/providers/google';
import { pusherServer } from '@/lib/pusherServer';

export const detectBrowser = (ua = '') => {
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return 'Chrome';
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'Safari';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  return 'Unknown';
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  // Add configuration for extended session and strategy
  session: {
    strategy: 'jwt', // Use JWT for sessions (you can change to 'database' if you want persistence in MongoDB)
    maxAge: 7 * 24 * 60 * 60, // 7 days (instead of the default 24 hours) - extend the session to avoid quick logouts
    updateAge: 24 * 60 * 60, // Renew the token every 24 hours
  },
  callbacks: {
    async session({ session, token }) {
      if (token?.userId) {
        session.user = session.user || {};
        session.user.id = token.userId;
      }
  
      if (token.sessionLogId) {
        session.sessionLogId = token.sessionLogId;
      }
  
      if (token.customUA) {
        session.customUA = token.customUA;
      }
  
      return session;
    },
    // Invoked on successful signin
    async signIn({ profile }) {
      // 1. Connect to database
      await connectDB();
      // 2. Check if user exists
      const userExists = await User.findOne({ email: profile.email });
      // 3. If not, then add user to database
      if (!userExists) {
        // Truncate user name if too long
        const username = profile.name.slice(0, 20);

        await User.create({
          email: profile.email,
          username,
          image: profile.picture,
        });
      }
      // Return true to allow sign in
      return true;
    },
    // Add callback JWT to manage the tokens and avoid the interminent expirations
    async jwt({ token, user, trigger, session }) {
      try {
        await connectDB();
        const dbUser = await User.findOne({ email: user?.email ?? token?.email });
        if (dbUser) {
          token.userId = dbUser._id.toString();

          if (trigger === 'update' && session?.customUA && session.customUA !== token.customUA) {
            token.customUA = session.customUA;

            if (token.sessionLogId) {
              const SessionLog = (await import('@/models/SessionLog')).default;
              await SessionLog.findByIdAndUpdate(token.sessionLogId, {
                userAgent: token.customUA,
                browser: detectBrowser(token.customUA),
              });
            }
          }
  
          // Only on initial sign-in (when `user` is present), create a new session log
          if (user && !token.sessionLogId) {
            const SessionLog = (await import('@/models/SessionLog')).default;

            const created = await SessionLog.create({
              user: dbUser._id,   
              username: dbUser.username,        
              loginAt: new Date(),
              userAgent: token.customUA || 'Unknown',
              browser: detectBrowser(token.customUA || ''),
            });
            token.sessionLogId = created._id.toString();

            // Pusher: user become online
            await pusherServer.trigger('user-status', 'user-status-changed', {
              userId: dbUser._id.toString(),
              online: true,
            });
          }
        }

        return token;
      } catch (err) {
        console.log('JWT dbUser lookup error:', err.message);
      }
      return token;
    },
  },
  events: {
    async signOut({ token, session }) {
      try {
        await connectDB();
        const SessionLog = (await import('@/models/SessionLog')).default;
  
        const userId = token?.userId || session?.user?.id;
  
        let log = null;
  
        if (token?.sessionLogId) {
          log = await SessionLog.findById(token.sessionLogId);
        }
  
        if (!log && userId) {
          log = await SessionLog.findOne({
            user: userId, 
            $or: [
              { logoutAt: { $exists: false } },
              { logoutAt: null },
            ],
          }).sort({ loginAt: -1 });
        }
  
        if (!log) {
          console.log('signOut event: no open SessionLog found, skipping');
          return;
        }
  
        log.logoutAt = new Date();
        log.durationSeconds = Math.round((log.logoutAt - log.loginAt) / 1000);
        await log.save();
  
        // Pusher: offline
        await pusherServer.trigger('user-status', 'user-status-changed', {
          userId: userId?.toString() || log.user.toString(),
          online: false,
        });

      } catch (err) {
        console.log('SessionLog signOut error:', err);
      }
    },
  },
  // Add secret param for security
  secret: process.env.NEXTAUTH_SECRET,
};
