'use client';
import { useEffect, useState, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function SessionHistory() {
  const { data: session, update } = useSession();
  const [logs, setLogs] = useState([]);
  const sentRef = useRef(false);
  const tableContainerRef = useRef(null);

  useEffect(() => {
    let aborted = false;
    const run = async () => {
      if (!session?.user?.id) return;

      if (!sentRef.current) {
        const ua = navigator.userAgent;
        await update({ customUA: ua });
        sentRef.current = true;
      }

      const res = await fetch(`/api/users/${session.user.id}/session-logs`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!aborted) setLogs(Array.isArray(data) ? data : []);
    };
    run();

    return () => {
      aborted = true;
    };
  }, [session?.user?.id, session?.customUA, update]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }

    if (tableContainerRef.current) {
      const el = tableContainerRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [logs.length]);

  const handleLogout = async () => {
    try {
      await signOut({ redirect: true, callbackUrl: '/' });
    } catch (e) {
      console.error('logout error', e);
    }
  };

  return (
    <div ref={tableContainerRef} className='mt-8 max-h-64 overflow-y-auto'>
      <Table>
        <TableCaption>A list of your recent login sessions.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[100px]'>Login</TableHead>
            <TableHead>Logout</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead className='text-right'>Browser</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((l) => {
            const dur = l.durationSeconds
              ? `${Math.floor(l.durationSeconds / 60)}m ${l.durationSeconds % 60}s`
              : l.logoutAt
                ? '0s'
                : 'Active';

            return (
              <TableRow key={l._id}>
                <TableCell className='p-2'>
                  {new Date(l.loginAt).toLocaleString()}
                </TableCell>
                <TableCell className='p-2'>
                  {l.logoutAt
                    ? new Date(l.logoutAt).toLocaleString()
                    : 'Active'}
                </TableCell>
                <TableCell className='p-2'>{dur}</TableCell>
                <TableCell className='p-2'>{l.browser}</TableCell>
              </TableRow>
            );
          })}

          {!logs.length && (
            <TableRow>
              <TableCell colSpan={4} className='p-2 text-gray-500'>
                No sessions recorded.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <button
        onClick={handleLogout}
        className='mt-4 px-3 py-2 bg-blue-600 text-white rounded text-sm'
      >
        Logout
      </button>
    </div>
  );
}
