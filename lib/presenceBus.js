const clients = new Set();

export function addPresenceClient(controller) {
  const client = { controller };
  clients.add(client);
  return client;
}

export function removePresenceClient(client) {
  clients.delete(client);
}

export function broadcastPresence(payload) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  const enc = new TextEncoder();
  const chunk = enc.encode(data);

  for (const { controller } of clients) {
    try {
      controller.enqueue(chunk);
    } catch {
      // ignorăm erorile de scriere
    }
  }
}