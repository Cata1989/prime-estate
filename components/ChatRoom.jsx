'use client';
import { useEffect, useRef, useState } from 'react';

export default function ChatRoom({ conversationId }) {
  const [messages, setMessages] = useState([]);
  const inputRef = useRef(null);
  const esRef = useRef(null);

  useEffect(() => {
    if (!conversationId) return;

    let aborted = false;

    (async () => {
      const init = await fetch(`/api/chat/messages/${conversationId}`, {
        cache: 'no-store',
      }).then((r) => r.json());

      if (!aborted) {
        setMessages(Array.isArray(init) ? init : []);
      }

      if (esRef.current) {
        esRef.current.close();
      }

      const es = new EventSource(
        `/api/chat/stream?conversationId=${encodeURIComponent(
          conversationId
        )}`
      );
      esRef.current = es;

      es.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          setMessages((prev) => {
            if (prev.some((m) => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
        } catch { }
      };

      es.onerror = () => { };
    })();

    return () => {
      aborted = true;
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [conversationId]);

  const send = async () => {
    const text = inputRef.current?.value?.trim();
    if (!text) return;

    await fetch('/api/chat/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, text }),
    });

    inputRef.current.value = '';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  } 

  return (
    <div className="flex flex-col gap-3">
      <div className="border rounded p-3 h-80 overflow-y-auto bg-white">
        {messages.map((m) => (
          <div key={m._id} className="mb-2">
            <div className="text-xs text-gray-500 flex justify-between">
              <span>{m.senderName || 'Necunoscut'}</span>
              <span>{new Date(m.createdAt).toLocaleString()}</span>
            </div>
            <div>{m.text}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          onKeyDown={handleKeyDown}
          className="border rounded px-2 py-1 flex-1"
          placeholder="Scrie un mesaj..."
        />
        <button
          onClick={send}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          Trimite
        </button>
      </div>
    </div>
  );
}