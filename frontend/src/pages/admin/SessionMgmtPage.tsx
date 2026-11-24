import React from 'react';
import { MonitorSmartphone, Trash2 } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { MOCK_USERS } from '../../mocks/data';

export default function SessionMgmtPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-text">Session Management</h1><p className="text-sm text-text-muted mt-1">View and terminate active user sessions.</p></div>
        <Button variant="danger" size="sm">Terminate All Sessions</Button>
      </div>
      <div className="card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-bg border-b border-border">
            <tr>{['User', 'Role', 'IP Address', 'Signed In', 'Last Activity', 'Status', ''].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs text-text-muted font-medium">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {MOCK_USERS.filter(u => u.status === 'active').map((u, i) => (
              <tr key={u.uid} className="border-b border-border hover:bg-bg">
                <td className="px-4 py-3"><div><p className="font-medium text-text">{u.name}</p><p className="text-[10px] font-mono text-text-muted">{u.email}</p></div></td>
                <td className="px-4 py-3 capitalize text-text-muted text-xs">{u.role.replace('_',' ')}</td>
                <td className="px-4 py-3 font-mono text-xs text-text-muted">192.168.1.{100 + i}</td>
                <td className="px-4 py-3 text-xs text-text-muted">2 hours ago</td>
                <td className="px-4 py-3 text-xs text-text-muted">Just now</td>
                <td className="px-4 py-3"><StatusBadge variant="success" label="active" /></td>
                <td className="px-4 py-3"><button className="p-1.5 rounded hover:bg-danger-soft text-danger" title="Terminate"><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
