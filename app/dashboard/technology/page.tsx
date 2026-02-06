'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Technology {
  id: string;
  name: string;
  type: string;
  category: string;
  manufacturer?: string;
  purchaseDate: string;
  purchasePrice: number;
  status: string;
  automationLevel?: string;
  isAIPowered?: boolean;
  tasksAutomated?: string;
  productivityGain?: number;
  scalabilityScore?: number;
  integrations?: string;
  usersSupported?: number;
  timeSaved?: number;
}

export default function TechnologyPage() {
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'software',
    category: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    purchasePrice: '',
    maintenanceCost: '',
    status: 'operational',
    location: '',
    automationLevel: 'partial',
    isAIPowered: false,
    tasksAutomated: '',
    productivityGain: '',
    scalabilityScore: '5',
    integrations: '',
    usersSupported: '',
    timeSaved: '',
  });

  useEffect(() => {
    fetchTechnologies();
  }, []);

  const fetchTechnologies = async () => {
    try {
      const response = await fetch('/api/technology');
      if (response.ok) {
        const data = await response.json();
        setTechnologies(data);
      }
    } catch (error) {
      console.error('Failed to fetch technologies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/technology?id=${editingId}` : '/api/technology';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          purchasePrice: parseFloat(formData.purchasePrice),
          maintenanceCost: formData.maintenanceCost ? parseFloat(formData.maintenanceCost) : 0,
          productivityGain: formData.productivityGain ? parseFloat(formData.productivityGain) : undefined,
          scalabilityScore: formData.scalabilityScore ? parseInt(formData.scalabilityScore) : undefined,
          usersSupported: formData.usersSupported ? parseInt(formData.usersSupported) : undefined,
          timeSaved: formData.timeSaved ? parseFloat(formData.timeSaved) : undefined,
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({
          name: '',
          type: 'software',
          category: '',
          manufacturer: '',
          model: '',
          serialNumber: '',
          purchaseDate: '',
          purchasePrice: '',
          maintenanceCost: '',
          status: 'operational',
          location: '',
          automationLevel: 'partial',
          isAIPowered: false,
          tasksAutomated: '',
          productivityGain: '',
          scalabilityScore: '5',
          integrations: '',
          usersSupported: '',
          timeSaved: '',
        });
        fetchTechnologies();
      }
    } catch (error) {
      console.error('Failed to save technology:', error);
    }
  };

  const handleEdit = (tech: Technology) => {
    setFormData({
      name: tech.name,
      type: tech.type,
      category: tech.category,
      manufacturer: tech.manufacturer || '',
      model: '',
      serialNumber: '',
      purchaseDate: tech.purchaseDate.split('T')[0],
      purchasePrice: tech.purchasePrice.toString(),
      maintenanceCost: '',
      status: tech.status,
      location: '',
      automationLevel: tech.automationLevel || 'partial',
      isAIPowered: tech.isAIPowered || false,
      tasksAutomated: tech.tasksAutomated || '',
      productivityGain: tech.productivityGain?.toString() || '',
      scalabilityScore: tech.scalabilityScore?.toString() || '5',
      integrations: tech.integrations || '',
      usersSupported: tech.usersSupported?.toString() || '',
      timeSaved: tech.timeSaved?.toString() || '',
    });
    setEditingId(tech.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this technology asset?')) return;
    
    try {
      const response = await fetch(`/api/technology?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTechnologies();
      }
    } catch (error) {
      console.error('Failed to delete technology:', error);
    }
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      type: 'software',
      category: '',
      manufacturer: '',
      model: '',
      serialNumber: '',
      purchaseDate: '',
      purchasePrice: '',
      maintenanceCost: '',
      status: 'operational',
      location: '',
      automationLevel: 'partial',
      isAIPowered: false,
      tasksAutomated: '',
      productivityGain: '',
      scalabilityScore: '5',
      integrations: '',
      usersSupported: '',
      timeSaved: '',
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Technology & Automation</h1>
          <p className="text-gray-600">Scale growth through automation, AI, and modern productivity tools</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Technology
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Technology Asset' : 'Add New Technology'}</h2>
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
                <option value="software">Software/SaaS</option>
                <option value="ai-tool">AI Tool</option>
                <option value="automation-system">Automation System</option>
                <option value="machinery">Machinery</option>
                <option value="hardware">Hardware</option>
                <option value="digital-tool">Digital Tool</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                placeholder="e.g., productivity, automation, analytics, communication"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                required
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
                <option value="operational">Operational</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>

            {/* Automation & Productivity Section */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-3 border-b pb-2">
                Automation & Productivity Impact
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Automation Level</label>
              <select
                value={formData.automationLevel}
                onChange={(e) => setFormData({ ...formData, automationLevel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="none">None - Manual operation</option>
                <option value="partial">Partial - Some automation</option>
                <option value="full">Full - Fully automated</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">AI-Powered?</label>
              <select
                value={formData.isAIPowered.toString()}
                onChange={(e) => setFormData({ ...formData, isAIPowered: e.target.value === 'true' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="false">No AI/ML</option>
                <option value="true">Yes - Uses AI/ML</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tasks Automated</label>
              <input
                type="text"
                value={formData.tasksAutomated}
                onChange={(e) => setFormData({ ...formData, tasksAutomated: e.target.value })}
                placeholder="e.g., Email responses, Data entry, Report generation"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Productivity Gain (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.productivityGain}
                onChange={(e) => setFormData({ ...formData, productivityGain: e.target.value })}
                placeholder="e.g., 50 = 50% improvement"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Scalability Score (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.scalabilityScore}
                onChange={(e) => setFormData({ ...formData, scalabilityScore: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">How well does this scale as you grow?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Users Supported</label>
              <input
                type="number"
                value={formData.usersSupported}
                onChange={(e) => setFormData({ ...formData, usersSupported: e.target.value })}
                placeholder="Number of team members using it"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Saved (hours/week)</label>
              <input
                type="number"
                step="0.5"
                value={formData.timeSaved}
                onChange={(e) => setFormData({ ...formData, timeSaved: e.target.value })}
                placeholder="Hours saved per week"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Integrations</label>
              <input
                type="text"
                value={formData.integrations}
                onChange={(e) => setFormData({ ...formData, integrations: e.target.value })}
                placeholder="e.g., Slack, Zapier, Google Workspace, Salesforce"
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
        ) : technologies.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No technology assets yet. Add your first one!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manufacturer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {technologies.map((tech) => (
                  <tr key={tech.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{tech.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{tech.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{tech.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{tech.manufacturer || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      ${tech.purchasePrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          tech.status === 'operational'
                            ? 'bg-green-100 text-green-800'
                            : tech.status === 'maintenance'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {tech.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(tech)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tech.id)}
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
