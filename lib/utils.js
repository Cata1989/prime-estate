import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { pusherServer } from '@/lib/pusherServer';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatTimestamp = (createdAt) => {
  if (!createdAt) return '';
  const d = new Date(createdAt);
  return d.toLocaleString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export async function getPresenceMembers(channelName) {
  try {
    const path = `/channels/${encodeURIComponent(channelName)}/users`;

    const res = await pusherServer.get({ path });

    const data = await res.json().catch((e) => {
      return null;
    });

    if (!data || !Array.isArray(data.users)) {
      return [];
    }

    return data.users;
  } catch (err) {
    console.error('getPresenceMembers error', err);
    return [];
  }
}
