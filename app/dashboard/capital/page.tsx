'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Capital {
  id: string;
  name: string;
  type: string;
  category: string;
  amount: number;
  currency: string;
  status: string;
  returns?: number;
  investmentPurpose: string;
  fundingSource: string;
  deploymentStrategy?: string;
  isLeveraged: boolean;
  leverageRatio: number;
  monthlyBurnRate: number;
  runwayMonths: number;
  capitalEfficiency: number;
  allocationBreakdown?: string;
  bankAccounts?: string;
  moneyMarketAccounts?: string;
  financialLiteracy: string;
  growthVelocity: number;
  replaceManualEffort: boolean;
}

export default function CapitalPage() {
  const [capitals, setCapitals] = useState<Capital[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'financial',
    category: '',
    amount: '',
    currency: 'USD',
    acquisitionDate: '',
    status: 'active',
    description: '',
    returns: '',
    investmentPurpose: 'operations',
    fundingSource: 'bootstrapped',
    deploymentStrategy: '',
    isLeveraged: false,
    leverageRatio: '1.0',
    monthlyBurnRate: '0',
    runwayMonths: '0',
    capitalEfficiency: '0',
    allocationBreakdown: '',
    bankAccounts: '',
    moneyMarketAccounts: '',
    financialLiteracy: 'basic',
    growthVelocity: '0',
    replaceManualEffort: false,
  });

  useEffect(() => {
    fetchCapitals();
  }, []);

  const fetchCapitals = async () => {
    try {
      const response = await fetch('/api/capital');
      if (response.ok) {
        const data = await response.json();
        setCapitals(data);
      }
    } catch (error) {
      console.error('Failed to fetch capitals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/capital?id=${editingId}` : '/api/capital';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          returns: formData.returns ? parseFloat(formData.returns) : undefined,
          leverageRatio: parseFloat(formData.leverageRatio),
          monthlyBurnRate: parseFloat(formData.monthlyBurnRate),
          runwayMonths: parseFloat(formData.runwayMonths),
          capitalEfficiency: parseFloat(formData.capitalEfficiency),
          growthVelocity: parseFloat(formData.growthVelocity),
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({
          name: '',
          type: 'financial',
          category: '',
          amount: '',
          currency: 'USD',
          acquisitionDate: '',
          status: 'active',
          description: '',
          returns: '',
          investmentPurpose: 'operations',
          fundingSource: 'bootstrapped',
          deploymentStrategy: '',
          isLeveraged: false,
          leverageRatio: '1.0',
          monthlyBurnRate: '0',
          runwayMonths: '0',
          capitalEfficiency: '0',
          allocationBreakdown: '',
          bankAccounts: '',
          moneyMarketAccounts: '',
          financialLiteracy: 'basic',
          growthVelocity: '0',
          replaceManualEffort: false,
        });
        fetchCapitals();
      }
    } catch (error) {
      console.error('Failed to save capital:', error);
    }
  };

  const handleEdit = (capital: Capital) => {
    setFormData({
      name: capital.name,
      type: capital.type,
      category: capital.category,
      amount: capital.amount.toString(),
      currency: capital.currency,
      acquisitionDate: '',
      status: capital.status,
      description: '',
      returns: capital.returns ? capital.returns.toString() : '',
      investmentPurpose: capital.investmentPurpose,
      fundingSource: capital.fundingSource,
      deploymentStrategy: capital.deploymentStrategy || '',
      isLeveraged: capital.isLeveraged,
      leverageRatio: capital.leverageRatio.toString(),
      monthlyBurnRate: capital.monthlyBurnRate.toString(),
      runwayMonths: capital.runwayMonths.toString(),
      capitalEfficiency: capital.capitalEfficiency.toString(),
      allocationBreakdown: capital.allocationBreakdown || '',
      bankAccounts: capital.bankAccounts || '',
      moneyMarketAccounts: capital.moneyMarketAccounts || '',
      financialLiteracy: capital.financialLiteracy,
      growthVelocity: capital.growthVelocity.toString(),
      replaceManualEffort: capital.replaceManualEffort,
    });
    setEditingId(capital.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this capital asset?')) return;
    
    try {
      const response = await fetch(`/api/capital?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCapitals();
      }
    } catch (error) {
      console.error('Failed to delete capital:', error);
    }
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      type: 'financial',
      category: '',
      amount: '',
      currency: 'USD',
      acquisitionDate: '',
      status: 'active',
      description: '',
      returns: '',
      investmentPurpose: 'operations',
      fundingSource: 'bootstrapped',
      deploymentStrategy: '',
      isLeveraged: false,
      leverageRatio: '1.0',
      monthlyBurnRate: '0',
      runwayMonths: '0',
      capitalEfficiency: '0',
      allocationBreakdown: '',
      bankAccounts: '',
      moneyMarketAccounts: '',
      financialLiteracy: 'basic',
      growthVelocity: '0',
      replaceManualEffort: false,
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Capital & Financial Strategy</h1>
          <p className="text-gray-600">Fund operations, accelerate growth, and scale through strategic capital deployment</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Capital
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Capital Asset' : 'Add New Capital'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="financial">Financial</option>
                <option value="social">Social</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                placeholder="e.g., investment, cash, bonds"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Acquisition Date</label>
              <input
                type="date"
                value={formData.acquisitionDate}
                onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Returns/ROI (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.returns}
                onChange={(e) => setFormData({ ...formData, returns: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="active">Active</option>
                <option value="liquidated">Liquidated</option>
                <option value="matured">Matured</option>
              </select>
            </div>

            {/* Strategic Capital Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Investment Purpose</label>
              <select
                value={formData.investmentPurpose}
                onChange={(e) => setFormData({ ...formData, investmentPurpose: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="operations">Operations</option>
                <option value="growth">Growth</option>
                <option value="scaling">Scaling</option>
                <option value="research">Research & Development</option>
                <option value="marketing">Marketing</option>
                <option value="hiring">Hiring</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Funding Source</label>
              <select
                value={formData.fundingSource}
                onChange={(e) => setFormData({ ...formData, fundingSource: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="bootstrapped">Bootstrapped</option>
                <option value="investors">Investors</option>
                <option value="loans">Loans</option>
                <option value="grants">Grants</option>
                <option value="revenue">Revenue</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Financial Literacy Level</label>
              <select
                value={formData.financialLiteracy}
                onChange={(e) => setFormData({ ...formData, financialLiteracy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="basic">Basic</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Leverage Ratio (1.0 = none, 2.0 = 2x)</label>
              <input
                type="number"
                step="0.1"
                value={formData.leverageRatio}
                onChange={(e) => setFormData({ ...formData, leverageRatio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Burn Rate ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.monthlyBurnRate}
                onChange={(e) => setFormData({ ...formData, monthlyBurnRate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Runway (Months)</label>
              <input
                type="number"
                step="0.1"
                value={formData.runwayMonths}
                onChange={(e) => setFormData({ ...formData, runwayMonths: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Capital Efficiency (Revenue/$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.capitalEfficiency}
                onChange={(e) => setFormData({ ...formData, capitalEfficiency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Growth Velocity (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.growthVelocity}
                onChange={(e) => setFormData({ ...formData, growthVelocity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Deployment Strategy</label>
              <textarea
                value={formData.deploymentStrategy}
                onChange={(e) => setFormData({ ...formData, deploymentStrategy: e.target.value })}
                rows={2}
                placeholder="How is this capital being strategically deployed?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Allocation Breakdown (e.g., Operations:40, Marketing:30, Hiring:20, R&D:10)</label>
              <input
                type="text"
                value={formData.allocationBreakdown}
                onChange={(e) => setFormData({ ...formData, allocationBreakdown: e.target.value })}
                placeholder="Operations:40, Marketing:30, Hiring:20, R&D:10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Bank Accounts</label>
              <input
                type="text"
                value={formData.bankAccounts}
                onChange={(e) => setFormData({ ...formData, bankAccounts: e.target.value })}
                placeholder="e.g., Equity Bank - UGX 25M; Stanbic - USD 5k"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Money Market Accounts (Unit Trusts, Treasury Bills)</label>
              <input
                type="text"
                value={formData.moneyMarketAccounts}
                onChange={(e) => setFormData({ ...formData, moneyMarketAccounts: e.target.value })}
                placeholder="e.g., Treasury Bills - 12M; Unit Trust - 8M"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>

            <div className="md:col-span-2 flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isLeveraged}
                  onChange={(e) => setFormData({ ...formData, isLeveraged: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Using Leverage (OPM - Other People's Money)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.replaceManualEffort}
                  onChange={(e) => setFormData({ ...formData, replaceManualEffort: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Replaces Manual Effort</span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingId ? 'Update' : 'Save'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : capitals.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No capital records yet. Add your first one!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Runway</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Efficiency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Growth</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {capitals.map((capital) => (
                  <tr key={capital.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{capital.name}</div>
                      <div className="text-xs text-gray-500">{capital.category}</div>
                      {capital.replaceManualEffort && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                          Replaces Manual Work
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      <div className="font-semibold">{capital.currency} {capital.amount.toLocaleString()}</div>
                      {capital.isLeveraged && (
                        <div className="text-xs text-purple-600">{capital.leverageRatio}x Leverage</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 capitalize">
                      {capital.investmentPurpose}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 capitalize">
                      {capital.fundingSource}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {capital.runwayMonths > 0 ? `${capital.runwayMonths} mo` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {capital.capitalEfficiency > 0 ? `$${capital.capitalEfficiency.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {capital.growthVelocity > 0 ? `${capital.growthVelocity}%` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {capital.growthVelocity > 0 ? `${capital.growthVelocity}%` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          capital.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {capital.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(capital)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(capital.id)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
