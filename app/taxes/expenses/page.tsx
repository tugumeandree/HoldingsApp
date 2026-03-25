'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Receipt,
  Trash2,
  X,
  RefreshCw,
  ChevronDown,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatUGX, EXPENSE_CATEGORIES } from '@/lib/tax-utils';

const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number({ invalid_type_error: 'Enter a valid amount' }).positive('Must be positive'),
  date: z.string().min(1, 'Date is required'),
  category: z.string().min(1, 'Category is required'),
  deductible: z.boolean().default(false),
  receiptUrl: z.string().optional(),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

interface TaxEvent {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string;
  category: string;
  deductible: boolean;
  receiptUrl?: string;
}

// Heuristic for auto-suggesting deductibility
const LIKELY_DEDUCTIBLE = [
  'travel', 'transport', 'marketing', 'advertising', 'office',
  'utilities', 'professional', 'services', 'salaries', 'wages',
  'equipment', 'machinery', 'rent', 'premises', 'software',
  'technology', 'training', 'insurance', 'banking', 'repairs',
  'maintenance',
];

function isLikelyDeductible(category: string, description: string): boolean {
  const text = `${category} ${description}`.toLowerCase();
  return LIKELY_DEDUCTIBLE.some((k) => text.includes(k));
}

const CAT_COLORS: Record<string, string> = {
  'Travel & Transport': '#3b82f6',
  'Marketing & Advertising': '#f59e0b',
  'Office Supplies': '#8b5cf6',
  'Utilities': '#14b8a6',
  'Professional Services': '#10b981',
  'Salaries & Wages': '#ef4444',
  'Equipment & Machinery': '#6366f1',
  'Rent & Premises': '#f97316',
  'Software & Technology': '#0ea5e9',
  'Training & Development': '#84cc16',
  'Insurance': '#a855f7',
  'Banking & Finance Charges': '#64748b',
  'Repairs & Maintenance': '#78716c',
  'Entertainment': '#ec4899',
  'Other': '#9ca3af',
};

export default function ExpensesPage() {
  const [events, setEvents] = useState<TaxEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterDeductible, setFilterDeductible] = useState<'all' | 'deductible' | 'non-deductible'>(
    'all'
  );

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { deductible: false },
  });

  const category = watch('category');
  const description = watch('description');

  // Auto-suggest deductibility
  useEffect(() => {
    if (category || description) {
      setValue('deductible', isLikelyDeductible(category || '', description || ''));
    }
  }, [category, description, setValue]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/taxes/events?type=expense');
      if (res.ok) setEvents(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSubmit = async (data: ExpenseForm) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/taxes/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'expense',
          amount: data.amount,
          date: data.date,
          description: data.description,
          category: data.category,
          deductible: data.deductible,
          receiptUrl: data.receiptUrl,
          source: data.category,
        }),
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

  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    await fetch(`/api/taxes/events/${id}`, { method: 'DELETE' });
    loadData();
  };

  const totalExpenses = events.reduce((s, e) => s + e.amount, 0);
  const deductibleExpenses = events.filter((e) => e.deductible).reduce((s, e) => s + e.amount, 0);
  const nonDeductible = totalExpenses - deductibleExpenses;

  const filtered =
    filterDeductible === 'all'
      ? events
      : filterDeductible === 'deductible'
      ? events.filter((e) => e.deductible)
      : events.filter((e) => !e.deductible);

  // Chart: expenses by category
  const byCategory = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});
  const chartData = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track deductible and non-deductible business expenses
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
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Expense
            <ChevronDown
              className={`w-3 h-3 transition-transform ${showForm ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-orange-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Total Expenses YTD
          </p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{formatUGX(totalExpenses)}</p>
          <p className="text-xs text-gray-400 mt-1">{events.length} records</p>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Tax-Deductible
          </p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {formatUGX(deductibleExpenses)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {events.filter((e) => e.deductible).length} deductible items
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Non-Deductible
          </p>
          <p className="text-2xl font-bold text-gray-700 mt-1">{formatUGX(nonDeductible)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {events.filter((e) => !e.deductible).length} non-deductible items
          </p>
        </div>
      </div>

      {/* Add Expense Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 bg-orange-50 border-b border-orange-100">
            <h3 className="font-semibold text-gray-900">Add Expense Record</h3>
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
                placeholder="e.g. Fuel for site visit"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                {...register('category')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receipt Reference (optional)
              </label>
              <input
                {...register('receiptUrl')}
                placeholder="Receipt number or reference"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-start gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  {...register('deductible')}
                  type="checkbox"
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-gray-700">Tax-Deductible Expense</span>
              </label>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1.5">
                Auto-suggested
              </span>
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
                className="px-5 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium"
              >
                {submitting ? 'Saving…' : 'Save Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter + Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-gray-100 gap-2">
          <h3 className="font-semibold text-gray-900 text-sm">Expense Records</h3>
          <div className="flex gap-1">
            {(['all', 'deductible', 'non-deductible'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterDeductible(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
                  filterDeductible === f
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {f === 'non-deductible' ? 'Non-deductible' : f.charAt(0).toUpperCase() + f.slice(1)}
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
            <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No expense records yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 text-sm text-orange-600 hover:underline"
            >
              Add your first expense →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-center">Deductible</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center w-16">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{e.description}</p>
                      {e.receiptUrl && (
                        <p className="text-xs text-gray-400">Ref: {e.receiptUrl}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(e.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {e.deductible ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-orange-600">
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
              <tfoot className="bg-gray-50 border-t border-gray-200 font-semibold">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-gray-700">
                    Showing {filtered.length} of {events.length}
                  </td>
                  <td className="px-4 py-3 text-right text-orange-600">
                    {formatUGX(filtered.reduce((s, e) => s + e.amount, 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Expenses by Category Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Expenses by Category</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
              />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={95} />
              <Tooltip formatter={(value) => [formatUGX(Number(value)), 'Amount']} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={CAT_COLORS[entry.name] ?? '#9ca3af'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
