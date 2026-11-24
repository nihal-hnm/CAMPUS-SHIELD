import React, { useState } from 'react';
import { Search, UserPlus, Edit, Shield, Trash2 } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { MOCK_USERS } from '../../mocks/data';
import { formatRelative } from '../../utils/format';

export default function UserManagementPage() {
  const [search, setSearch] = useState('');
  const users = MOCK_USERS.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const statusVariant: Record<string, any> = {
    active: 'success', inactive: 'neutral', exited: 'danger', graduated: 'neutral',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">User Management</h1>
          <p className="text-sm text-text-muted mt-1">Manage institutional accounts, roles, departments, and special tags.</p>
        </div>
        <Button variant="primary" size="sm"><UserPlus className="w-4 h-4" /> Add User</Button>
      </div>

      <div className="card px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="search" placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <select className="input w-auto"><option>All Roles</option></select>
        <select className="input w-auto"><option>All Statuses</option></select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg border-b border-border">
            <tr>
              {['Name / ID', 'Email', 'Role', 'Department', 'Tags', 'Status', 'Last Sign-in', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-text-muted font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.uid} className="border-b border-border hover:bg-bg">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-text">{u.name}</p>
                      <p className="text-[10px] font-mono text-text-muted">{u.uid}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-muted">{u.email}</td>
                <td className="px-4 py-3 text-text-muted capitalize">{u.role.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-text-muted">{u.department}</td>
                <td className="px-4 py-3">
                  {u.special_tags.length > 0
                    ? <span className="badge badge-info">{u.special_tags.join(', ')}</span>
                    : <span className="text-text-muted text-xs">—</span>
                  }
                </td>
                <td className="px-4 py-3"><StatusBadge variant={statusVariant[u.status] ?? 'neutral'} label={u.status} /></td>
                <td className="px-4 py-3 text-xs text-text-muted">{formatRelative(u.last_active_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded hover:bg-bg text-text-muted" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 rounded hover:bg-bg text-text-muted" title="Assign tag"><Shield className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 rounded hover:bg-danger-soft text-danger" title="Revoke access"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
