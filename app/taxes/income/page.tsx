'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  TrendingUp,
  FileText,
  Trash2,
  X,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { formatUGX, INCOME_SOURCES } from '@/lib/tax-utils';

const incomeSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number({ invalid_type_error: 'Enter a valid amount' }).positive('Must be positive'),
  date: z.string().min(1, 'Date is required'),
  source: z.string().min(1, 'Source is required'),
  category: z.string().min(1, 'Category is required'),
  whtApplicable: z.boolean().optional(),
  whtAmount: z.number().min(0).optional(),
});

type IncomeForm = z.infer<typeof incomeSchema>;

interface TaxEvent {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string;
  category: string;
  source?: string;
  whtAmount?: number;
}

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316'];

export default function IncomePage() {
  const [events, setEvents] = useState<TaxEvent[]>([]);
  const [whtEvents, setWhtEvents] = useState<TaxEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'wht'>('all');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<IncomeForm>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { whtApplicable: false, whtAmount: 0 },
  });

  const whtApplicable = watch('whtApplicable');
  const amount = watch('amount');

  // Auto-suggest WHT at 6% when enabled
  useEffect(() => {
    if (whtApplicable && amount > 0) {
      setValue('whtAmount', Math.round(amount * 0.06));
    }
  }, [whtApplicable, amount, setValue]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [incRes, whtRes] = await Promise.all([
        fetch('/api/taxes/events?type=income'),
        fetch('/api/taxes/events?type=wht'),
      ]);
      if (incRes.ok) setEvents(await incRes.json());
      if (whtRes.ok) setWhtEvents(await whtRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSubmit = async (data: IncomeForm) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/taxes/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'income',
          amount: data.amount,
          date: data.date,
          description: data.description,
          category: data.category,
          source: data.source,
          deductible: false,
          whtAmount: (data.whtApplicable ?? false) ? (data.whtAmount ?? 0) : 0,
        }),
      });

      if (res.ok && (data.whtApplicable ?? false) && (data.whtAmount ?? 0) > 0) {
        // Create a WHT credit event automatically
        await fetch('/api/taxes/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'wht',
            amount: data.whtAmount,
            date: data.date,
            description: `WHT certificate: ${data.description}`,
            category: 'WHT Credit',
            source: data.source,
            deductible: false,
          }),
        });
      }

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

  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this record?')) return;
    await fetch(`/api/taxes/events/${id}`, { method: 'DELETE' });
    loadData();
  };

  const totalIncome = events.reduce((s, e) => s + e.amount, 0);
  const totalWhtEmbedded = events.reduce((s, e) => s + (e.whtAmount ?? 0), 0);
  const totalWHTCerts = whtEvents.reduce((s, e) => s + e.amount, 0);

  // Chart: income by source
  const bySource = events.reduce<Record<string, number>>((acc, e) => {
    const key = e.source ?? 'Unknown';
    acc[key] = (acc[key] ?? 0) + e.amount;
    return acc;
  }, {});
  const chartData = Object.entries(bySource).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Income</h1>
          <p className="text-sm text-gray-500 mt-1">
            Record all income and track WHT certificates
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="p-2 text-gray-500 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Income
            <ChevronDown className={`w-3 h-3 transition-transform ${showForm ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Income YTD</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatUGX(totalIncome)}</p>
          <p className="text-xs text-gray-400 mt-1">{events.length} records</p>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">WHT Certificates</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{formatUGX(totalWHTCerts + totalWhtEmbedded)}</p>
          <p className="text-xs text-gray-400 mt-1">{whtEvents.length} certificates</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Net Taxable Income</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatUGX(totalIncome)}</p>
          <p className="text-xs text-blue-600 mt-1">{formatUGX(totalWHTCerts + totalWhtEmbedded)} in credits</p>
        </div>
      </div>

      {/* Add Income Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 bg-emerald-50 border-b border-emerald-100">
            <h3 className="font-semibold text-gray-900">Add Income Record</h3>
            <button
              onClick={() => { setShowForm(false); reset(); }}
              className="text-gray-400 hover:text-gray-600 p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <input
                {...register('description')}
                placeholder="e.g. Consultancy fee from ABC Ltd"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (UGX) *</label>
              <input
                {...register('amount', { valueAsNumber: true })}
                type="number"
                min="0"
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                {...register('date')}
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Income Source *</label>
              <select
                {...register('source')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">Select source</option>
                {INCOME_SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.source && (
                <p className="text-red-500 text-xs mt-1">{errors.source.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <input
                {...register('category')}
                placeholder="e.g. Professional Services"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  {...register('whtApplicable')}
                  type="checkbox"
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Withholding Tax (WHT) was deducted
                </span>
              </label>
              {whtApplicable && (
                <div>
                  <input
                    {...register('whtAmount', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    placeholder="WHT amount (UGX)"
                    className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    Standard rate 6% ={' '}
                    {amount > 0 ? formatUGX(Math.round(amount * 0.06)) : 'UGX 0'}
                  </p>
                </div>
              )}
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
                className="px-5 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium"
              >
                {submitting ? 'Saving…' : 'Save Income'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Income ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('wht')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'wht'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            WHT Tracker ({whtEvents.length})
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : activeTab === 'all' ? (
          events.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No income records yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-2 text-sm text-emerald-600 hover:underline"
              >
                Add your first income →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-left">Source</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">WHT</th>
                    <th className="px-4 py-3 text-center w-16">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {events.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{e.description}</p>
                        <p className="text-xs text-gray-400">{e.category}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{e.source ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(e.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-600 text-right">
                        {formatUGX(e.amount)}
                      </td>
                      <td className="px-4 py-3 text-blue-600 text-right">
                        {e.whtAmount && e.whtAmount > 0 ? formatUGX(e.whtAmount) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => deleteEvent(e.id)}
                          className="p-1 text-gray-300 hover:text-red-500 transition-colors rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200 font-semibold">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-gray-700">Total</td>
                    <td className="px-4 py-3 text-right text-emerald-600">{formatUGX(totalIncome)}</td>
                    <td className="px-4 py-3 text-right text-blue-600">{formatUGX(totalWhtEmbedded)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )
        ) : whtEvents.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No WHT certificates yet</p>
            <p className="text-xs mt-1">
              WHT certificates are auto-created when you add income with &quot;WHT deducted&quot; checked.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blue-50">
                <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Certificate Description</th>
                  <th className="px-4 py-3 text-left">Source</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">WHT Credit</th>
                  <th className="px-4 py-3 text-center w-16">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {whtEvents.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{e.description}</td>
                    <td className="px-4 py-3 text-gray-600">{e.source ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(e.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-blue-600 text-right">
                      {formatUGX(e.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => deleteEvent(e.id)}
                        className="p-1 text-gray-300 hover:text-red-500 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-blue-50 border-t border-gray-200 font-semibold">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-gray-700">Total WHT Credits</td>
                  <td className="px-4 py-3 text-right text-blue-600">{formatUGX(totalWHTCerts)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Income by Source Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Income by Source</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [formatUGX(Number(value)), 'Amount']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
