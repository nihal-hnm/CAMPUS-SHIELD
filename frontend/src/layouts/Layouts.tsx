import React from 'react';
import { AppSidebar } from '../components/layout/AppSidebar';
import { TopNavbar } from '../components/layout/TopNavbar';
import { SidebarProvider } from '../context/SidebarContext';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-bg">
        {/* Sidebar */}
        <AppSidebar />

        {/* Main content */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <TopNavbar />
          <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6">
            <div className="max-w-[1440px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export function UserLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
