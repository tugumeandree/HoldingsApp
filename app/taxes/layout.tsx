'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  Calculator,
  ClipboardCheck,
  FolderOpen,
  FileBarChart2,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  Landmark,
} from 'lucide-react';

const taxNavItems = [
  { name: 'Dashboard', href: '/taxes/dashboard', icon: LayoutDashboard },
  { name: 'Income', href: '/taxes/income', icon: TrendingUp },
  { name: 'Expenses', href: '/taxes/expenses', icon: Receipt },
  { name: 'Calculations', href: '/taxes/calculations', icon: Calculator },
  { name: 'Compliance', href: '/taxes/compliance', icon: ClipboardCheck },
  { name: 'Documents', href: '/taxes/documents', icon: FolderOpen },
  { name: 'Reports', href: '/taxes/reports', icon: FileBarChart2 },
];

export default function TaxLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading Tax Platform…</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const currentYear = new Date().getFullYear();
  const taxYearStart = currentYear - 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-gray-900 shadow-2xl transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Landmark className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-sm leading-tight">Tax Platform</h2>
                <p className="text-gray-400 text-xs">Uganda Revenue Authority</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Back to Dashboard */}
          <div className="px-3 pt-3 pb-1">
            <Link
              href="/dashboard"
              className="flex items-center px-3 py-2 text-xs font-medium text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-2" />
              Back to Dashboard
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-2">
            <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Modules
            </p>
            <div className="space-y-0.5">
              {taxNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5 mr-3 flex-shrink-0 w-5 h-5" />
                    <span className="truncate">{item.name}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-300" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Tax year badge */}
            <div className="mt-6 mx-1 p-3 bg-gray-800 rounded-xl border border-gray-700">
              <p className="text-xs text-gray-500 font-medium">Current Tax Year</p>
              <p className="text-sm font-bold text-white mt-0.5">
                {taxYearStart}/{currentYear}
              </p>
              <p className="text-xs text-emerald-400 mt-1">URA · Calendar Year</p>
            </div>
          </nav>

          {/* User footer */}
          <div className="border-t border-gray-700 px-3 py-4">
            <div className="px-3 py-2 mb-1">
              <p className="text-sm font-medium text-white truncate">{session.user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{session.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin', redirect: true })}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-400 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="flex items-center justify-between px-5 py-3.5">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-gray-700">Tax Operating Platform</span>
              <span className="hidden sm:inline text-xs text-gray-400">
                · FY {taxYearStart}/{currentYear}
              </span>
            </div>
            <div className="text-sm text-gray-500 hidden sm:block">{session.user?.name}</div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
