// Stub pages for remaining admin routes
import React from 'react';

function StubPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-text">{title}</h1>
        <p className="text-sm text-text-muted mt-1">{description}</p>
      </div>
      <div className="card p-10 text-center text-text-muted text-sm">
        🚧 This section is under construction. Full implementation coming soon.
      </div>
    </div>
  );
}

export default function DepartmentMgmtPage()    { return <StubPage title="Department Management"    description="Manage departments, their HODs and assigned subjects." />; }
