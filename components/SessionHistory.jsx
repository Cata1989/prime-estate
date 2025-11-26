'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';

export default function SessionHistory() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/users/${session.user.id}/session-logs`)
      .then(r => r.json())
      .then(data => Array.isArray(data) ? setLogs(data) : setLogs([]))
      .catch(() => setLogs([]));
  }, [session?.user?.id]);

  const handleLogout = useCallback(async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  }, [signOut]);

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-3">Login Sessions</h2>
      <table className="w-full text-sm border border-gray-200 rounded">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Login</th>
            <th className="p-2 text-left">Logout</th>
            <th className="p-2 text-left">Duration</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(l => {
            const dur = l.durationSeconds
              ? `${Math.floor(l.durationSeconds / 60)}m ${l.durationSeconds % 60}s`
              : l.logoutAt
              ? '0s'
              : 'Active';
            return (
              <tr key={l._id} className="border-t">
                <td className="p-2">{new Date(l.loginAt).toLocaleString()}</td>
                <td className="p-2">{l.logoutAt ? new Date(l.logoutAt).toLocaleString() : 'Active'}</td>
                <td className="p-2">{dur}</td>
              </tr>
            );
          })}
          {!logs.length && (
            <tr>
              <td colSpan={3} className="p-2 text-gray-500">No sessions recorded.</td>
            </tr>
          )}
        </tbody>
      </table>
      <button
        onClick={handleLogout}
        className="mt-4 px-3 py-2 bg-blue-600 text-white rounded text-sm"
      >
        Logout
      </button>
    </div>
  );
}