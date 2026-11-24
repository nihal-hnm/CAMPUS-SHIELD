import React, { type ReactNode } from 'react';
import { AppSidebar } from '../components/layout/AppSidebar';
import { TopNavbar } from '../components/layout/TopNavbar';

export function UserLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <AppSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1440px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  return <UserLayout>{children}</UserLayout>;
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      {children}
    </div>
  );
}
