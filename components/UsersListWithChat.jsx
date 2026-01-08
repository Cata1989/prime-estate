'use client';

import { useEffect, useState } from 'react';
import StartChatButton from '@/components/StartChatButton';
import { getPusherClient } from '@/lib/pusherClient';
import profileDefault from '@/assets/images/profile.png';
import Image from 'next/image';

export default function UsersListWithChat({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let aborted = false;

    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users/with-status', {
          cache: 'no-store',
        });
        const data = await res.json();

        if (!aborted && Array.isArray(data)) {
          setUsers(data);
        }
      } catch (e) {
        console.error('Error fetching users with status', e);
      } finally {
        if (!aborted) setLoading(false);
      }
    };

    fetchUsers();

    const pusher = getPusherClient();

    // 1) global status channel
    const channel = pusher.subscribe('user-status');

    const statusHandler = (payload) => {
      const { userId, online } = payload;

      setUsers((prev) => {
        const next = prev.map((u) =>
          (u._id?.toString?.() || u._id) === userId ? { ...u, online } : u
        );
        return next;
      });
    };

    channel.bind('user-status-changed', statusHandler);

    // 2) per-user unread channel
    let unreadChannel;
    let unreadHandler;

    if (currentUserId) {
      const chName = `user-${currentUserId}`;
      unreadChannel = pusher.subscribe(chName);

      unreadHandler = (payload) => {
        const { otherUserId, unreadCount } = payload;

        setUsers((prev) =>
          prev.map((u) =>
            (u._id?.toString?.() || u._id) === otherUserId
              ? { ...u, unreadCount }
              : u
          )
        );
      };

      unreadChannel.bind('unread-updated', unreadHandler);
    }

    return () => {
      aborted = true;
      channel.unbind('user-status-changed', statusHandler);
      pusher.unsubscribe('user-status');

      if (unreadChannel && unreadHandler) {
        unreadChannel.unbind('unread-updated', unreadHandler);
        pusher.unsubscribe(`user-${currentUserId}`);
      }
    };
  }, [currentUserId]);

  if (loading) return <div>Loading users...</div>;

  return (
    <div className='space-y-3'>
      {users
        .filter((u) => u._id !== currentUserId)
        .map((u) => (
          <div
            key={u._id}
            className='flex items-center justify-between border rounded px-3 py-2 bg-white'
          >
            <div className='flex items-center gap-2'>
              <div className='relative'>
                <Image
                  className='h-[56px] w-[56px] rounded-full mx-auto md:mx-0'
                  src={u.image || profileDefault}
                  width={200}
                  height={200}
                  alt='User'
                />
                <span
                  className={`absolute inline-block h-3 w-3 rounded-full bottom-1 right-1 transform translate-x-[20%] translate-y-[20%] ${
                    u.online ? 'bg-[#24832C]' : 'bg-gray-400'
                  }`}
                  title={u.online ? 'Online' : 'Offline'}
                />
              </div>
              <div>
                <div className='font-medium'>{u.username || u.email}</div>
                <div className='text-xs text-gray-500'>
                  {u.online ? 'Online now' : 'Offline'}
                </div>
              </div>
            </div>
            <StartChatButton
              otherUserId={u._id}
              unreadCount={u.unreadCount || 0}
            />
          </div>
        ))}
    </div>
  );
}
