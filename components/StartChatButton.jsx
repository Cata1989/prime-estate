'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function StartChatButton({ otherUserId, unreadCount = 0 }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const start = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/chat/conversations/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId }),
      });
      const data = await res.json();
      if (res.ok && data.conversationId) {
        router.push(`/chat/${data.conversationId}`);
      } else {
        alert(data.error || 'Error starting chat');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={start}
      disabled={loading}
      className='relative px-3 py-2 bg-blue-600 text-white rounded text-sm'
    >
      {loading ? 'Opening chat' : 'Start chat'}

      {unreadCount > 0 && (
        <span className='absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] px-1'>
          {unreadCount}
        </span>
      )}
    </button>
  );
}
