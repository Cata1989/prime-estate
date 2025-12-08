'use client';

import { useEffect, useState } from 'react';
import StartChatButton from '@/components/StartChatButton';

export default function UsersListWithChat({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let aborted = false;

    (async () => {
      try {
        const res = await fetch('/api/users/with-status', { cache: 'no-store' });
        const data = await res.json();
        if (!aborted && Array.isArray(data)) {
          setUsers(data);
        }
      } catch (e) {
        console.error('Error fetching users with status', e);
      } finally {
        if (!aborted) setLoading(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, []);

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="space-y-3">
      {users
        .filter((u) => u._id !== currentUserId)
        .map((u) => (
          <div
            key={u._id}
            className="flex items-center justify-between border rounded px-3 py-2 bg-white"
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-3 w-3 rounded-full ${
                  u.online ? 'bg-green-500' : 'bg-gray-400'
                }`}
                title={u.online ? 'Online' : 'Offline'}
              />
              <div>
                <div className="font-medium">
                  {u.username || u.email}
                </div>
                <div className="text-xs text-gray-500">
                  {u.online ? 'Online now' : 'Offline'}
                </div>
              </div>
            </div>
            <StartChatButton otherUserId={u._id} />
          </div>
        ))}
    </div>
  );
}