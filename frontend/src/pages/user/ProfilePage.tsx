import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Shield, Sliders } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-text">Profile & Settings</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-6 col-span-2 space-y-4">
          <h2 className="text-base font-semibold text-text flex items-center gap-2"><User className="w-4 h-4 text-primary" />Profile</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              ['Name', user.name],
              ['Email', user.email],
              ['Role', user.role.replace('_', ' ')],
              ['Department', user.department],
              ['Status', user.status],
              ['Subjects', user.assigned_subjects.join(', ') || 'N/A'],
              ['Special Tags', user.special_tags.join(', ') || 'None'],
            ].map(([k, v]) => (
              <React.Fragment key={k}>
                <dt className="text-text-muted font-medium">{k}</dt>
                <dd className="text-text capitalize">{v}</dd>
              </React.Fragment>
            ))}
          </dl>
          <p className="text-xs text-text-muted border-t border-border pt-3">Contact your administrator to change profile information.</p>
        </div>
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2 mb-3"><Shield className="w-4 h-4 text-primary" />Security</h2>
            <p className="text-xs text-text-muted">Re-authentication is required every 90 minutes for confidential document access. Sessions end after 10 minutes of inactivity.</p>
          </div>
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2 mb-3"><Sliders className="w-4 h-4 text-primary" />Preferences</h2>
            <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded" />
              Compact table view
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
