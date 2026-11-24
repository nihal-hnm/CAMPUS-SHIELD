import React from 'react';
export default function PolicyMgmtPage() {
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-semibold text-text">Policy Management</h1><p className="text-sm text-text-muted mt-1">Security policies enforced by the backend engine.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { name: 'Idle Timeout Policy',    value: '10 minutes',   desc: 'Sessions end after 10 min of inactivity' },
          { name: 'Re-auth Policy',         value: '90 minutes',   desc: 'Re-authentication required every 90 min' },
          { name: 'Max Link TTL',           value: '60 minutes',   desc: 'Shared links valid for at most 60 min' },
        ].map(p => (
          <div key={p.name} className="card p-5">
            <p className="text-sm font-medium text-text">{p.name}</p>
            <p className="text-2xl font-semibold text-primary mt-1">{p.value}</p>
            <p className="text-xs text-text-muted mt-1">{p.desc}</p>
            <span className="badge badge-neutral mt-3">Locked — system policy</span>
          </div>
        ))}
      </div>
      <div className="card p-10 text-center text-text-muted text-sm">🚧 Custom policy editor coming soon.</div>
    </div>
  );
}
