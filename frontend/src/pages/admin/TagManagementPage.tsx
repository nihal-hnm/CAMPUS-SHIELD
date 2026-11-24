import React from 'react';
import { Tag } from 'lucide-react';
import { SPECIAL_TAGS } from '../../constants/classifications';
export default function TagManagementPage() {
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-semibold text-text">Special Tag Management</h1><p className="text-sm text-text-muted mt-1">Configure special permission tags and their scopes.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SPECIAL_TAGS.map(tag => (
          <div key={tag.value} className="card p-5">
            <div className="flex items-center gap-2 mb-2"><Tag className="w-4 h-4 text-primary" /><span className="font-medium text-text">{tag.label}</span></div>
            <p className="text-xs text-text-muted">{tag.scope}</p>
            <span className="font-mono text-xs bg-bg border border-border px-2 py-0.5 rounded mt-3 inline-block">{tag.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
