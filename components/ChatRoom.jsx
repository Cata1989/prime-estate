'use client';
import { useEffect, useRef, useState } from 'react';
import { getPusherClient } from '@/lib/pusherClient';
import { formatTimestamp } from '@/lib/utils';

export default function ChatRoom({ conversationId, initialMessages }) {
  const [messages, setMessages] = useState(initialMessages || []);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const pusher = getPusherClient();

    const channelName = `conversation-${conversationId}`;
    const presenceChannelName = `presence-conversation-${conversationId}`;

    const channel = pusher.subscribe(channelName);
    pusher.subscribe(presenceChannelName);

    const handler = (payload) => {
      setMessages((prev) => [...prev, payload]);
    };

    channel.bind('message-created', handler);

    // fetch messages on mount
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat/messages/${conversationId}`);
        if (!res.ok) return;
        const data = await res.json();
        setMessages(data);
      } catch (e) {
        console.error('fetchMessages error', e);
      }
    };

    fetchMessages();

    return () => {
      channel.unbind('message-created', handler);
      pusher.unsubscribe(channelName);
      pusher.unsubscribe(presenceChannelName);
    };
  }, [conversationId]);

  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      setSending(true);
      const res = await fetch(`/api/chat/messages/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Send message error:', data.error);
      }

      setText('');
    } catch (err) {
      console.error('Send message exception:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[70vh] border rounded p-3">
      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {messages.map((m) => (
            <div key={m._id} className="text-sm">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold">{m.senderName}</span>
                <span className="text-[11px] text-gray-500">
                  {formatTimestamp(m.createdAt)}
                </span>
              </div>
              <div>{m.text}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          className="flex-1 border rounded px-2 py-1 text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write something..."
        />
        <button
          type="submit"
          disabled={sending}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}