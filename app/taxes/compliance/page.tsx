'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ClipboardCheck,
  Plus,
  X,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap,
  Calendar,
  Trash2,
} from 'lucide-react';

interface ComplianceItem {
  id: string;
  type: string;
  period: string;
  dueDate: string;
  status: string;
  description?: string;
  taxAmount?: number;
  filedDate?: string;
}

const formSchema = z.object({
  type: z.enum(['return', 'payment']),
  period: z.enum(['monthly', 'quarterly', 'annual']),
  dueDate: z.string().min(1, 'Due date is required'),
  description: z.string().min(1, 'Description is required'),
  taxAmount: z.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    pending: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-700',
      icon: <Clock className="w-3 h-3" />,
    },
    filed: {
      label: 'Filed',
      className: 'bg-emerald-100 text-emerald-700',
      icon: <CheckCircle className="w-3 h-3" />,
    },
    paid: {
      label: 'Paid',
      className: 'bg-blue-100 text-blue-700',
      icon: <CheckCircle className="w-3 h-3" />,
    },
    overdue: {
      label: 'Overdue',
      className: 'bg-red-100 text-red-700',
      icon: <AlertCircle className="w-3 h-3" />,
    },
  };
  const s = map[status] ?? map.pending;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}
    >
      {s.icon}
      {s.label}
    </span>
  );
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export default function CompliancePage() {
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'filed' | 'paid' | 'overdue'>('all');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/taxes/compliance');
      if (res.ok) setItems(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/taxes/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        reset();
        setShowForm(false);
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const body: Record<string, unknown> = { status };
    if (status === 'filed' || status === 'paid') {
      body.filedDate = new Date().toISOString();
    }
    await fetch(`/api/taxes/compliance/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    loadData();
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this compliance item?')) return;
    await fetch(`/api/taxes/compliance/${id}`, { method: 'DELETE' });
    loadData();
  };

  // Auto-generate Uganda PAYE filing calendar for current year
  const generateDeadlines = async () => {
    setGenerating(true);
    const year = new Date().getFullYear();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const deadlines = months.map((month, i) => {
      // PAYE due 15th of the FOLLOWING month
      const dueMonth = i + 2; // 1-indexed next month
      const dueYear = dueMonth > 12 ? year + 1 : year;
      const actualMonth = dueMonth > 12 ? 1 : dueMonth;
      const dueDate = `${dueYear}-${String(actualMonth).padStart(2, '0')}-15`;
      return {
        type: 'return' as const,
        period: 'monthly' as const,
        dueDate,
        description: `PAYE Return – ${month} ${year}`,
        taxEventIds: '[]',
        status: new Date(dueDate) < new Date() ? 'overdue' : 'pending',
      };
    });

    // Annual income tax return due June 30 of following year
    deadlines.push({
      type: 'return' as const,
      period: 'annual' as const,
      dueDate: `${year + 1}-06-30`,
      description: `Annual Income Tax Return – ${year}`,
      taxEventIds: '[]',
      status: 'pending',
    });

    try {
      await Promise.all(
        deadlines.map((d) =>
          fetch('/api/taxes/compliance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(d),
          })
        )
      );
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const filtered =
    filter === 'all' ? items : items.filter((i) => i.status === filter);

  const stats = {
    total: items.length,
    pending: items.filter((i) => i.status === 'pending').length,
    filed: items.filter((i) => i.status === 'filed').length,
    paid: items.filter((i) => i.status === 'paid').length,
    overdue: items.filter((i) => i.status === 'overdue').length,
  };

  // Upcoming deadlines (next 60 days)
  const upcoming = items
    .filter((i) => i.status === 'pending' && daysUntil(i.dueDate) >= 0 && daysUntil(i.dueDate) <= 60)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance</h1>
          <p className="text-sm text-gray-500 mt-1">
            URA filing calendar, returns tracker &amp; payment reminders
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="p-2 text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {items.length === 0 && (
            <button
              onClick={generateDeadlines}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              <Zap className="w-4 h-4" />
              {generating ? 'Generating…' : 'Auto-generate URA Calendar'}
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Deadline
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-700', border: 'border-gray-200' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-700', border: 'border-yellow-200' },
          { label: 'Completed', value: stats.filed + stats.paid, color: 'text-emerald-700', border: 'border-emerald-200' },
          { label: 'Overdue', value: stats.overdue, color: 'text-red-700', border: 'border-red-200' },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-xl border ${s.border} p-4 shadow-sm`}>
            <p className="text-xs text-gray-500 uppercase font-medium tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Upcoming Deadlines */}
      {upcoming.length > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-900">
              Upcoming in Next 60 Days ({upcoming.length})
            </h3>
          </div>
          <div className="space-y-2">
            {upcoming.map((item) => {
              const days = daysUntil(item.dueDate);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-white rounded-lg px-3 py-2.5 border border-amber-100"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.dueDate).toLocaleDateString('en-UG', { dateStyle: 'medium' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        days <= 7
                          ? 'bg-red-100 text-red-700'
                          : days <= 30
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {days}d
                    </span>
                    <button
                      onClick={() => updateStatus(item.id, 'filed')}
                      className="text-xs text-emerald-600 hover:underline font-medium"
                    >
                      Mark Filed
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 bg-blue-50 border-b border-blue-100">
            <h3 className="font-semibold text-gray-900">Add Compliance Deadline</h3>
            <button
              onClick={() => { setShowForm(false); reset(); }}
              className="text-gray-400 hover:text-gray-600 p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <input
                {...register('description')}
                placeholder="e.g. PAYE Return – March 2025"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                {...register('type')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="return">Tax Return</option>
                <option value="payment">Tax Payment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period *</label>
              <select
                {...register('period')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
              <input
                {...register('dueDate')}
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.dueDate && (
                <p className="text-red-500 text-xs mt-1">{errors.dueDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Tax Amount (UGX)
              </label>
              <input
                {...register('taxAmount', { valueAsNumber: true })}
                type="number"
                min="0"
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { reset(); setShowForm(false); }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {submitting ? 'Saving…' : 'Save Deadline'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter + Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-gray-100 gap-2">
          <h3 className="font-semibold text-gray-900 text-sm">All Compliance Items</h3>
          <div className="flex flex-wrap gap-1">
            {(['all', 'pending', 'filed', 'paid', 'overdue'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                  filter === f
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No compliance items</p>
            {items.length === 0 && (
              <button
                onClick={generateDeadlines}
                className="mt-2 text-sm text-emerald-600 hover:underline"
              >
                Generate URA filing calendar →
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Due Date</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Days</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => {
                  const days = daysUntil(item.dueDate);
                  const isPending = item.status === 'pending';
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{item.description}</p>
                        <p className="text-xs text-gray-400 capitalize">{item.period}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(item.dueDate).toLocaleDateString('en-UG', { dateStyle: 'medium' })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.status === 'pending' || item.status === 'overdue' ? (
                          <span
                            className={`text-xs font-semibold ${
                              days < 0
                                ? 'text-red-600'
                                : days <= 7
                                ? 'text-orange-600'
                                : 'text-gray-500'
                            }`}
                          >
                            {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {isPending && (
                            <>
                              <button
                                onClick={() => updateStatus(item.id, 'filed')}
                                className="text-xs px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium"
                              >
                                Filed
                              </button>
                              <button
                                onClick={() => updateStatus(item.id, 'paid')}
                                className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                              >
                                Paid
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-1 text-gray-300 hover:text-red-500 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Information Box */}
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          Uganda URA Filing Reminders
        </h4>
        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
          <li>PAYE monthly returns due by the <strong>15th of the following month</strong></li>
          <li>WHT returns also due by the <strong>15th of the following month</strong></li>
          <li>VAT returns due by the <strong>25th of the following month</strong></li>
          <li>Annual income tax return due <strong>6 months after end of accounting year</strong></li>
          <li>Late filing attracts a penalty of <strong>2% per month</strong> on outstanding tax</li>
        </ul>
      </div>
    </div>
  );
}
