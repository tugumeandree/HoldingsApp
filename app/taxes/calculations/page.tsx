'use client';

import { useState } from 'react';
import { Calculator, Info } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  formatUGX,
  calculateMonthlyPAYE,
  calculateTakeHome,
  getPAYEBreakdown,
  PAYE_BANDS,
} from '@/lib/tax-utils';

function InputField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      <input
        type="number"
        min="0"
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="0"
      />
    </div>
  );
}

function ResultRow({
  label,
  value,
  sub,
  highlight,
  isNegative,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  isNegative?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-3 px-4 rounded-lg ${
        highlight ? 'bg-blue-50 border border-blue-100' : 'border-b border-gray-100 last:border-0'
      }`}
    >
      <div>
        <p className={`text-sm font-medium ${highlight ? 'text-blue-900' : 'text-gray-700'}`}>
          {label}
        </p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
      <p
        className={`text-base font-bold ${
          highlight
            ? 'text-blue-700'
            : isNegative
            ? 'text-red-600'
            : 'text-gray-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function CalculationsPage() {
  const [grossMonthly, setGrossMonthly] = useState(0);
  const [whtCredit, setWhtCredit] = useState(0);
  const [scenario, setScenario] = useState<'monthly' | 'annual'>('monthly');

  const multiplier = scenario === 'annual' ? 12 : 1;
  const grossInput = grossMonthly;

  const result = calculateTakeHome(grossInput, whtCredit);
  const breakdown = getPAYEBreakdown(grossInput);

  // What-if scenarios: tax at different income levels
  const whatIfLevels = [250000, 500000, 1000000, 2000000, 5000000, 10000000, 15000000];
  const whatIfData = whatIfLevels.map((income) => {
    const paye = calculateMonthlyPAYE(income);
    const effective = income > 0 ? (paye / income) * 100 : 0;
    return {
      income: `${(income / 1000000).toFixed(1)}M`,
      incomeRaw: income,
      paye,
      takeHome: income - paye,
      effectiveRate: parseFloat(effective.toFixed(1)),
    };
  });

  const annualMultiplier = scenario === 'annual' ? 12 : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tax Calculations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Uganda PAYE calculator with WHT credit application · Real URA tax bands
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setScenario('monthly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            scenario === 'monthly'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setScenario('annual')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            scenario === 'annual'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Annual (×12)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">PAYE Calculator</h3>
          </div>

          <InputField
            label="Gross Monthly Income (UGX)"
            hint="Total employment / business income before deductions"
            value={grossMonthly}
            onChange={setGrossMonthly}
          />

          <InputField
            label="Monthly WHT Credits (UGX)"
            hint="Withholding tax already deducted by paying clients (credited against PAYE)"
            value={whtCredit}
            onChange={setWhtCredit}
          />

          {/* PAYE Band Reference */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-1.5 mb-2">
              <Info className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                URA PAYE Bands (Monthly)
              </p>
            </div>
            <div className="space-y-1">
              {PAYE_BANDS.map((band) => (
                <div key={band.range} className="flex justify-between text-xs">
                  <span className="text-gray-600">{band.range}</span>
                  <span
                    className={`font-semibold ${
                      band.rateNum === 0
                        ? 'text-emerald-600'
                        : band.rateNum <= 0.1
                        ? 'text-blue-600'
                        : band.rateNum <= 0.2
                        ? 'text-yellow-600'
                        : band.rateNum <= 0.3
                        ? 'text-orange-600'
                        : 'text-red-600'
                    }`}
                  >
                    {band.rate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">
            Tax Breakdown{scenario === 'annual' ? ' (Annual ×12)' : ' (Monthly)'}
          </h3>

          <div className="space-y-1">
            <ResultRow
              label="Gross Income"
              value={formatUGX(result.grossMonthly * annualMultiplier)}
              sub="Before any deductions"
            />
            <ResultRow
              label="PAYE Tax"
              value={`− ${formatUGX(result.paye * annualMultiplier)}`}
              sub={`Effective rate: ${result.effectiveTaxRate.toFixed(1)}%`}
              isNegative
            />
            {result.whtCredit > 0 && (
              <ResultRow
                label="WHT Credit Applied"
                value={`+ ${formatUGX(result.whtCredit * annualMultiplier)}`}
                sub="Offset against PAYE liability"
              />
            )}
            <div className="my-2 border-t border-gray-200" />
            <ResultRow
              label="Net Tax Liability"
              value={formatUGX(result.netTaxLiability * annualMultiplier)}
              sub="Amount payable to URA"
              isNegative={result.netTaxLiability > 0}
            />
            <ResultRow
              label="Net Take-Home Pay"
              value={formatUGX(result.netTakeHome * annualMultiplier)}
              sub="After all tax deductions"
              highlight
            />
          </div>

          {/* Effective rate bar */}
          {grossMonthly > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Effective tax rate</span>
                <span className="font-semibold text-gray-700">
                  {result.effectiveTaxRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-red-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, result.effectiveTaxRate)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>40%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Band-by-Band Breakdown */}
      {grossMonthly > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Band-by-Band PAYE Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-2 text-left">Income Band</th>
                  <th className="px-4 py-2 text-center">Rate</th>
                  <th className="px-4 py-2 text-right">Taxable Amount</th>
                  <th className="px-4 py-2 text-right">Tax in Band</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {breakdown.map((band) => (
                  <tr
                    key={band.label}
                    className={`${band.taxDue > 0 ? 'bg-blue-50/40' : ''} hover:bg-gray-50`}
                  >
                    <td className="px-4 py-2.5 text-gray-700">{band.label}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          band.rate === 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : band.rate <= 0.1
                            ? 'bg-blue-100 text-blue-700'
                            : band.rate <= 0.2
                            ? 'bg-yellow-100 text-yellow-700'
                            : band.rate <= 0.3
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {(band.rate * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600">
                      {band.taxableAmount > 0 ? formatUGX(band.taxableAmount) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold">
                      {band.taxDue > 0 ? (
                        <span className="text-orange-600">{formatUGX(band.taxDue)}</span>
                      ) : (
                        <span className="text-gray-400">UGX 0</span>
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold border-t-2 border-gray-300">
                  <td colSpan={2} className="px-4 py-3 text-gray-900">Total Monthly PAYE</td>
                  <td className="px-4 py-3 text-right text-gray-900">
                    {formatUGX(grossMonthly)}
                  </td>
                  <td className="px-4 py-3 text-right text-red-600">
                    {formatUGX(result.paye)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* What-If Scenarios */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-1">What-If Scenarios</h3>
        <p className="text-xs text-gray-400 mb-4">PAYE tax at various monthly income levels</p>
        <div className="overflow-x-auto mb-5">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-2 text-left">Monthly Income</th>
                <th className="px-4 py-2 text-right">PAYE Tax</th>
                <th className="px-4 py-2 text-right">Take-Home</th>
                <th className="px-4 py-2 text-right">Effective Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {whatIfData.map((row) => (
                <tr
                  key={row.income}
                  className={`hover:bg-gray-50 ${
                    row.incomeRaw === grossMonthly ? 'bg-blue-50 font-semibold' : ''
                  }`}
                >
                  <td className="px-4 py-2.5 text-gray-900">{formatUGX(row.incomeRaw)}</td>
                  <td className="px-4 py-2.5 text-right text-red-600">{formatUGX(row.paye)}</td>
                  <td className="px-4 py-2.5 text-right text-emerald-600">{formatUGX(row.takeHome)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        row.effectiveRate === 0
                          ? 'bg-emerald-100 text-emerald-700'
                          : row.effectiveRate < 15
                          ? 'bg-blue-100 text-blue-700'
                          : row.effectiveRate < 25
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {row.effectiveRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Effective Rate Chart */}
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={whatIfData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="income" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 45]}
            />
            <Tooltip formatter={(value) => [`${value}%`, 'Effective Rate']} />
            <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '30%', position: 'right', fontSize: 10 }} />
            <Bar dataKey="effectiveRate" radius={[4, 4, 0, 0]} name="Effective Rate">
              {whatIfData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.effectiveRate === 0
                      ? '#10b981'
                      : entry.effectiveRate < 15
                      ? '#3b82f6'
                      : entry.effectiveRate < 25
                      ? '#f59e0b'
                      : '#ef4444'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
