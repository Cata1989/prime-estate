'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function StartChatButton({ otherUserId }) {
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
        alert(data.error || 'Eroare la pornirea conversației');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={start}
      disabled={loading}
      className="px-3 py-2 bg-blue-600 text-white rounded text-sm"
    >
      {loading ? 'Se deschide...' : 'Start chat'}
    </button>
  );
}