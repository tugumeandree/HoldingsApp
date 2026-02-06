'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  DollarSign,
  Cpu,
  FileText,
  Briefcase,
  Map,
  LogOut,
  BarChart3,
  Menu,
  X,
  FileVideo,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Building2 },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Land', href: '/dashboard/land', icon: Map },
    { name: 'People & Teams', href: '/dashboard/labour', icon: Users },
    { name: 'Capital', href: '/dashboard/capital', icon: DollarSign },
    { name: 'Technology', href: '/dashboard/technology', icon: Cpu },
    { name: 'Data', href: '/dashboard/information', icon: FileText },
    { name: 'Businesses', href: '/dashboard/businesses', icon: Briefcase },
    { name: 'Content', href: '/dashboard/content', icon: FileVideo },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64 bg-white shadow-lg`}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between px-6 py-5 border-b">
            <h2 className="text-xl font-bold text-gray-900">Holdings</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-900"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t bg-gray-50 px-3 py-4">
            <div className="px-3 py-2 mb-2">
              <div className="text-sm font-medium text-gray-900 truncate">{session.user?.name}</div>
              <div className="text-xs text-gray-500 truncate">{session.user?.email}</div>
            </div>
            <button
              onClick={async () => {
                await signOut({ callbackUrl: '/auth/signin', redirect: true });
              }}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-gray-500 hover:text-gray-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="text-sm text-gray-600">
              Welcome back, {session.user?.name}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
