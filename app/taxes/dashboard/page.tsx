'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatUGX } from '@/lib/tax-utils';

interface TaxStats {
  totalIncomeYTD: number;
  totalExpensesYTD: number;
  totalWHTCreditedYTD: number;
  estimatedTaxDue: number;
  nextDeadline: { description: string; dueDate: string; daysLeft: number } | null;
  complianceScore: number;
  recentEvents: {
    id: string;
    type: string;
    amount: number;
    date: string;
    description: string;
    category: string;
  }[];
  monthlyBreakdown: { month: string; income: number; expenses: number; tax: number }[];
}

export default function TaxDashboard() {
  const [stats, setStats] = useState<TaxStats | null>(null);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/taxes/stats');
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
          <p className="text-sm text-gray-500">Loading tax data…</p>
        </div>
      </div>
    );
  }

  const score = stats?.complianceScore ?? 100;
  const scoreColor =
    score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';
  const scoreBg =
    score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  const scoreLabel =
    score >= 80 ? 'Excellent compliance' : score >= 60 ? 'Needs attention' : 'Action required';

  const metricsData = [
    {
      title: 'Total Income YTD',
      value: formatUGX(stats?.totalIncomeYTD ?? 0),
      sub: `Year ${year}`,
      icon: TrendingUp,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    {
      title: 'Deductible Expenses',
      value: formatUGX(stats?.totalExpensesYTD ?? 0),
      sub: 'Tax-deductible only',
      icon: TrendingDown,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-50',
      border: 'border-orange-200',
    },
    {
      title: 'WHT Credits',
      value: formatUGX(stats?.totalWHTCreditedYTD ?? 0),
      sub: 'Credited against PAYE',
      icon: DollarSign,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    {
      title: 'Estimated Tax Due',
      value: formatUGX(stats?.estimatedTaxDue ?? 0),
      sub: 'After WHT deductions',
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-50',
      border: 'border-red-200',
    },
  ];

  const deadline = stats?.nextDeadline;
  const deadlineBadge =
    !deadline
      ? null
      : deadline.daysLeft <= 7
      ? 'bg-red-100 text-red-700'
      : deadline.daysLeft <= 30
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-emerald-100 text-emerald-700';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tax Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Calendar Year {year} · Uganda Revenue Authority (PAYE)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <Link
            href="/taxes/income"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Income
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metricsData.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`bg-white rounded-xl border ${card.border} p-5 shadow-sm`}
            >
              <div className={`w-10 h-10 ${card.iconBg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{card.title}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{card.value}</p>
              <p className={`text-xs mt-1 ${card.iconColor}`}>{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Compliance Score + Next Deadline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Compliance Score */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-900">Compliance Score</h3>
          </div>
          <div className="flex items-end gap-6 mb-4">
            <div>
              <span className={`text-5xl font-extrabold ${scoreColor}`}>{score}</span>
              <span className="text-lg text-gray-400 ml-1">/100</span>
            </div>
            <div className="flex-1 pb-1">
              <div className="w-full bg-gray-200 rounded-full h-3 mb-1.5">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${scoreBg}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{scoreLabel}</p>
            </div>
          </div>
          <Link
            href="/taxes/compliance"
            className="text-sm text-emerald-600 hover:underline font-medium"
          >
            View compliance details →
          </Link>
        </div>

        {/* Next Deadline */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Next Filing Deadline</h3>
          </div>
          {deadline ? (
            <>
              <p className="text-lg font-bold text-gray-900">{deadline.description}</p>
              <p className="text-sm text-gray-500 mt-1">
                Due:{' '}
                {new Date(deadline.dueDate).toLocaleDateString('en-UG', { dateStyle: 'long' })}
              </p>
              <span
                className={`mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${deadlineBadge}`}
              >
                {deadline.daysLeft <= 0
                  ? 'Overdue!'
                  : `${deadline.daysLeft} day${deadline.daysLeft === 1 ? '' : 's'} remaining`}
              </span>
            </>
          ) : (
            <div>
              <p className="text-gray-500 text-sm">No upcoming deadlines tracked.</p>
              <Link
                href="/taxes/compliance"
                className="mt-3 inline-block text-sm text-emerald-600 hover:underline font-medium"
              >
                Generate URA filing calendar →
              </Link>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link href="/taxes/compliance" className="text-sm text-emerald-600 hover:underline font-medium">
              View all deadlines →
            </Link>
          </div>
        </div>
      </div>

      {/* Monthly Chart */}
      {stats && stats.monthlyBreakdown.some((m) => m.income > 0 || m.expenses > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-1">Monthly Income vs Expenses</h3>
          <p className="text-xs text-gray-400 mb-4">Calendar Year {year} · amounts in UGX millions</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.monthlyBreakdown} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
              />
              <Tooltip
                formatter={(value) => [formatUGX(Number(value)), '']}
                labelStyle={{ fontWeight: 600 }}
              />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Income" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expenses" fill="#f97316" name="Expenses" radius={[3, 3, 0, 0]} />
              <Bar dataKey="tax" fill="#3b82f6" name="Est. Tax" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Events */}
      {stats && stats.recentEvents.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Tax Events</h3>
            <Link href="/taxes/income" className="text-sm text-emerald-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-0.5">
            {stats.recentEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between py-2.5 px-1 border-b border-gray-50 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{event.description}</p>
                  <p className="text-xs text-gray-500">
                    {event.category} · {new Date(event.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="ml-4 text-right flex-shrink-0">
                  <p
                    className={`text-sm font-semibold ${
                      event.type === 'income'
                        ? 'text-emerald-600'
                        : event.type === 'expense'
                        ? 'text-red-600'
                        : 'text-blue-600'
                    }`}
                  >
                    {event.type === 'expense' ? '−' : '+'}
                    {formatUGX(event.amount)}
                  </p>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      event.type === 'income'
                        ? 'bg-emerald-100 text-emerald-700'
                        : event.type === 'expense'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {event.type.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No tax events recorded yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Start by adding income or expenses to track your tax position.
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <Link
              href="/taxes/income"
              className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Add Income
            </Link>
            <Link
              href="/taxes/expenses"
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              Add Expense
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/taxes/income"
          className="block text-center py-3 px-4 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
        >
          Add Income
        </Link>
        <Link
          href="/taxes/expenses"
          className="block text-center py-3 px-4 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition-colors shadow-sm"
        >
          Add Expense
        </Link>
        <Link
          href="/taxes/calculations"
          className="block text-center py-3 px-4 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          Calculate PAYE
        </Link>
        <Link
          href="/taxes/reports"
          className="block text-center py-3 px-4 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm"
        >
          View Reports
        </Link>
      </div>
    </div>
  );
}
