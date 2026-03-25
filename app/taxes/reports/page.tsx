'use client';

import { useState, useEffect } from 'react';
import {
  FileBarChart2,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatUGX, calculateAnnualPAYE, PAYE_BANDS } from '@/lib/tax-utils';

interface TaxEvent {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string;
  category: string;
  deductible: boolean;
  whtAmount?: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PIE_COLORS = ['#10b981', '#f97316', '#3b82f6', '#8b5cf6', '#14b8a6'];

export default function ReportsPage() {
  const [events, setEvents] = useState<TaxEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/taxes/events?year=${selectedYear}`);
      if (res.ok) setEvents(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  // Aggregations
  const incomeEvents = events.filter((e) => e.type === 'income');
  const expenseEvents = events.filter((e) => e.type === 'expense');
  const whtEvents = events.filter((e) => e.type === 'wht');

  const totalIncome = incomeEvents.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = expenseEvents.reduce((s, e) => s + e.amount, 0);
  const deductibleExpenses = expenseEvents.filter((e) => e.deductible).reduce((s, e) => s + e.amount, 0);
  const whtCreditsCerts = whtEvents.reduce((s, e) => s + e.amount, 0);
  const whtFromIncome = incomeEvents.reduce((s, e) => s + (e.whtAmount ?? 0), 0);
  const totalWHT = whtCreditsCerts + whtFromIncome;

  const taxableIncome = Math.max(0, totalIncome - deductibleExpenses);
  const estimatedPAYE = calculateAnnualPAYE(taxableIncome);
  const estimatedTaxDue = Math.max(0, estimatedPAYE - totalWHT);
  const effectiveRate = totalIncome > 0 ? (estimatedTaxDue / totalIncome) * 100 : 0;

  // Monthly data
  const monthlyData = MONTHS.map((month, i) => {
    const monthEvts = events.filter((e) => new Date(e.date).getMonth() === i);
    const income = monthEvts.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const expenses = monthEvts.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    const wht = monthEvts.filter((e) => e.type === 'wht').reduce((s, e) => s + e.amount, 0);
    return { month, income, expenses, wht, net: income - expenses };
  });

  // Expense by category
  const expByCat = expenseEvents.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});
  const expCatData = Object.entries(expByCat)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // CSV Export
  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Description', 'Category', 'Amount (UGX)', 'Deductible', 'WHT Amount'];
    const rows = events.map((e) => [
      new Date(e.date).toLocaleDateString(),
      e.type.toUpperCase(),
      `"${e.description.replace(/"/g, '""')}"`,
      e.category,
      e.amount.toString(),
      e.deductible ? 'Yes' : 'No',
      (e.whtAmount ?? 0).toString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-report-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // PDF Export
  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    const pageW = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, pageW, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX POSITION REPORT', 14, 13);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Year: ${selectedYear}  ·  Uganda Revenue Authority (PAYE)`, 14, 22);

    doc.setTextColor(30, 30, 30);
    let y = 40;

    // Summary
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Tax Position Summary', 14, y);

    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const summaryRows = [
      ['Total Gross Income (YTD)', formatUGX(totalIncome)],
      ['Total Expenses (YTD)', formatUGX(totalExpenses)],
      ['Deductible Expenses', formatUGX(deductibleExpenses)],
      ['WHT Credits Applied', formatUGX(totalWHT)],
      ['Taxable Income', formatUGX(taxableIncome)],
      ['Estimated PAYE', formatUGX(estimatedPAYE)],
      ['Net Tax Due', formatUGX(estimatedTaxDue)],
      ['Effective Tax Rate', `${effectiveRate.toFixed(1)}%`],
    ];

    summaryRows.forEach(([label, value], i) => {
      if (i % 2 === 0) {
        doc.setFillColor(247, 248, 249);
        doc.rect(14, y - 4, pageW - 28, 8, 'F');
      }
      doc.text(label, 16, y);
      doc.setFont('helvetica', 'bold');
      doc.text(value, pageW - 16, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      y += 8;
    });

    y += 8;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYE Tax Bands (Monthly Reference)', 14, y);

    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    PAYE_BANDS.forEach((band, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(247, 248, 249);
        doc.rect(14, y - 4, pageW - 28, 7, 'F');
      }
      doc.text(band.range, 16, y);
      doc.text(band.rate, pageW - 16, y, { align: 'right' });
      y += 7;
    });

    y += 10;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Transaction Log', 14, y);

    y += 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    events.slice(0, 30).forEach((e, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      if (i % 2 === 0) {
        doc.setFillColor(247, 248, 249);
        doc.rect(14, y - 3.5, pageW - 28, 6.5, 'F');
      }
      doc.text(new Date(e.date).toLocaleDateString(), 16, y);
      doc.text(e.type.toUpperCase(), 45, y);
      const desc = e.description.length > 35 ? e.description.substring(0, 33) + '…' : e.description;
      doc.text(desc, 70, y);
      doc.text(formatUGX(e.amount), pageW - 16, y, { align: 'right' });
      y += 7;
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generated on ${new Date().toLocaleDateString()} · Page ${i} of ${pageCount}`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    }

    doc.save(`tax-report-${selectedYear}.pdf`);
  };

  const years = [selectedYear - 2, selectedYear - 1, selectedYear].reverse();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tax position summary, year-to-date reports &amp; exports
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={loadData}
            className="p-2 text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Income', value: formatUGX(totalIncome), icon: TrendingUp, color: 'text-emerald-600', border: 'border-emerald-200', bg: 'bg-emerald-50' },
              { label: 'Total Expenses', value: formatUGX(totalExpenses), icon: TrendingDown, color: 'text-orange-600', border: 'border-orange-200', bg: 'bg-orange-50' },
              { label: 'WHT Credits', value: formatUGX(totalWHT), icon: DollarSign, color: 'text-blue-600', border: 'border-blue-200', bg: 'bg-blue-50' },
              { label: 'Tax Due', value: formatUGX(estimatedTaxDue), icon: FileBarChart2, color: 'text-red-600', border: 'border-red-200', bg: 'bg-red-50' },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className={`bg-white rounded-xl border ${card.border} p-4 shadow-sm`}>
                  <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center mb-2`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{card.label}</p>
                  <p className={`text-lg font-bold mt-0.5 ${card.color}`}>{card.value}</p>
                </div>
              );
            })}
          </div>

          {/* Tax Position Table */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">
              Full Tax Position – {selectedYear}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {[
                    { label: 'Gross Income', value: totalIncome, bold: false },
                    { label: '  Less: Deductible Expenses', value: -deductibleExpenses, bold: false },
                    { label: 'Taxable Income', value: taxableIncome, bold: true },
                    { label: 'Estimated PAYE (Annual)', value: estimatedPAYE, bold: false },
                    { label: '  Less: WHT Credits', value: -totalWHT, bold: false },
                    { label: 'Net Tax Payable to URA', value: estimatedTaxDue, bold: true },
                  ].map((row) => (
                    <tr key={row.label} className={`${row.bold ? 'bg-gray-50' : ''}`}>
                      <td className={`px-4 py-3 ${row.bold ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                        {row.label}
                      </td>
                      <td
                        className={`px-4 py-3 text-right ${
                          row.bold
                            ? 'font-bold text-gray-900'
                            : row.value < 0
                            ? 'text-red-600'
                            : 'text-gray-700'
                        }`}
                      >
                        {row.value < 0 ? `(${formatUGX(-row.value)})` : formatUGX(row.value)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-50 border-t-2 border-emerald-200">
                    <td className="px-4 py-3 font-bold text-gray-900">
                      Effective Tax Rate
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">
                      {effectiveRate.toFixed(1)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Income vs Expenses */}
          {monthlyData.some((m) => m.income > 0 || m.expenses > 0) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">
                Monthly Income vs Expenses – {selectedYear}
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                  />
                  <Tooltip formatter={(v) => [formatUGX(Number(v)), '']} />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" name="Income" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="expenses" fill="#f97316" name="Expenses" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Net Cash Flow Line */}
          {monthlyData.some((m) => Math.abs(m.net) > 0) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Monthly Net Cash Flow</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
                  />
                  <Tooltip formatter={(v) => [formatUGX(Number(v)), 'Net']} />
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#10b981' }}
                    name="Net"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Expense Breakdown Pie */}
          {expCatData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Top Expense Categories</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={expCatData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {expCatData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [formatUGX(Number(v)), 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Transaction Table */}
          {events.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">All Transactions – {selectedYear}</h3>
                <span className="text-xs text-gray-400">{events.length} records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Description</th>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {events.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-600">
                          {new Date(e.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              e.type === 'income'
                                ? 'bg-emerald-100 text-emerald-700'
                                : e.type === 'expense'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {e.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-900 max-w-xs truncate">
                          {e.description}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{e.category}</td>
                        <td
                          className={`px-4 py-2.5 text-right font-semibold ${
                            e.type === 'income'
                              ? 'text-emerald-600'
                              : e.type === 'expense'
                              ? 'text-orange-600'
                              : 'text-blue-600'
                          }`}
                        >
                          {formatUGX(e.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
