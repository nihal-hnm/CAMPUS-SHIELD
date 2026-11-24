import React from 'react';
import { Bell } from 'lucide-react';
import { EmptyState } from '../../components/feedback/States';

export default function NotificationsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text">Notifications</h1>
        <button className="text-sm text-primary hover:underline">Mark all as read</button>
      </div>
      <EmptyState title="You're all caught up" description="No new notifications." action={<Bell className="w-8 h-8 text-text-muted mx-auto" strokeWidth={1.5} />} />
    </div>
  );
}
