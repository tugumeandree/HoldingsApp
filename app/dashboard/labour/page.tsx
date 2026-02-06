'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Labour {
  id: string;
  employeeName: string;
  position: string;
  department: string;
  employeeType: string;
  salary: number;
  hireDate: string;
  status: string;
  collaborationType?: string;
  contributionArea?: string;
  networkValue?: number;
  projectsLed?: number;
  teamImpact?: string;
  mentorshipRole?: string;
  isOutsourced?: boolean;
  teamSize?: number;
  impactMultiplier?: number;
  collectiveAchievements?: string;
}

export default function LabourPage() {
  const [labours, setLabours] = useState<Labour[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    employeeName: '',
    position: '',
    department: '',
    employeeType: 'full-time',
    salary: '',
    hireDate: '',
    status: 'active',
    skills: '',
    contactInfo: '',
    collaborationType: 'internal',
    contributionArea: '',
    networkValue: '',
    projectsLed: '0',
    teamImpact: 'medium',
    mentorshipRole: 'none',
    isOutsourced: false,
    teamSize: '1',
    impactMultiplier: '1',
    collectiveAchievements: '',
  });

  useEffect(() => {
    fetchLabours();
  }, []);

  const fetchLabours = async () => {
    try {
      const response = await fetch('/api/labour');
      if (response.ok) {
        const data = await response.json();
        setLabours(data);
      }
    } catch (error) {
      console.error('Failed to fetch labours:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/labour?id=${editingId}` : '/api/labour';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          salary: parseFloat(formData.salary),
          networkValue: formData.networkValue ? parseFloat(formData.networkValue) : undefined,
          projectsLed: formData.projectsLed ? parseInt(formData.projectsLed) : 0,
          teamSize: formData.teamSize ? parseInt(formData.teamSize) : 1,
          impactMultiplier: formData.impactMultiplier ? parseFloat(formData.impactMultiplier) : 1,
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({
          employeeName: '',
          position: '',
          department: '',
          employeeType: 'full-time',
          salary: '',
          hireDate: '',
          status: 'active',
          skills: '',
          contactInfo: '',
          collaborationType: 'internal',
          contributionArea: '',
          networkValue: '',
          projectsLed: '0',
          teamImpact: 'medium',
          mentorshipRole: 'none',
          isOutsourced: false,
          teamSize: '1',
          impactMultiplier: '1',
          collectiveAchievements: '',
        });
        fetchLabours();
      }
    } catch (error) {
      console.error('Failed to save labour:', error);
    }
  };

  const handleEdit = (labour: Labour) => {
    setFormData({
      employeeName: labour.employeeName,
      position: labour.position,
      department: labour.department,
      employeeType: labour.employeeType,
      salary: labour.salary.toString(),
      hireDate: labour.hireDate.split('T')[0],
      status: labour.status,
      skills: '',
      contactInfo: '',
      collaborationType: labour.collaborationType || 'internal',
      contributionArea: labour.contributionArea || '',
      networkValue: labour.networkValue?.toString() || '',
      projectsLed: labour.projectsLed?.toString() || '0',
      teamImpact: labour.teamImpact || 'medium',
      mentorshipRole: labour.mentorshipRole || 'none',
      isOutsourced: labour.isOutsourced || false,
      teamSize: labour.teamSize?.toString() || '1',
      impactMultiplier: labour.impactMultiplier?.toString() || '1',
      collectiveAchievements: labour.collectiveAchievements || '',
    });
    setEditingId(labour.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    
    try {
      const response = await fetch(`/api/labour?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchLabours();
      }
    } catch (error) {
      console.error('Failed to delete labour:', error);
    }
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      employeeName: '',
      position: '',
      department: '',
      employeeType: 'full-time',
      salary: '',
      hireDate: '',
      status: 'active',
      skills: '',
      contactInfo: '',
      collaborationType: 'internal',
      contributionArea: '',
      networkValue: '',
      projectsLed: '0',
      teamImpact: 'medium',
      mentorshipRole: 'none',
      isOutsourced: false,
      teamSize: '1',
      impactMultiplier: '1',
      collectiveAchievements: '',
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">People & Teams</h1>
          <p className="text-gray-600">Magnify impact through collective effort - where teams achieve more than individuals</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Team Member
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Team Member' : 'Add New Team Member'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employee Name</label>
              <input
                type="text"
                value={formData.employeeName}
                onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Member Type</label>
              <select
                value={formData.employeeType}
                onChange={(e) => setFormData({ ...formData, employeeType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="full-time">Full-time Employee</option>
                <option value="part-time">Part-time Employee</option>
                <option value="contract">Contractor</option>
                <option value="collaborator">Collaborator</option>
                <option value="partner">Strategic Partner</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Salary ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hire Date</label>
              <input
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>

            {/* Collaboration & Team Amplification Section */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-3 border-b pb-2">
                Collaboration & Team Amplification
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Collaboration Type</label>
              <select
                value={formData.collaborationType}
                onChange={(e) => setFormData({ ...formData, collaborationType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="internal">Internal Team</option>
                <option value="external">External Consultant</option>
                <option value="outsourced">Outsourced Service</option>
                <option value="partnership">Partnership</option>
                <option value="network">Network Connection</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contribution Area</label>
              <input
                type="text"
                value={formData.contributionArea}
                onChange={(e) => setFormData({ ...formData, contributionArea: e.target.value })}
                placeholder="e.g., Expertise, Resources, Connections"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Network Value ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.networkValue}
                onChange={(e) => setFormData({ ...formData, networkValue: e.target.value })}
                placeholder="Quantified value of their network/influence"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Projects Led</label>
              <input
                type="number"
                value={formData.projectsLed}
                onChange={(e) => setFormData({ ...formData, projectsLed: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Team Impact</label>
              <select
                value={formData.teamImpact}
                onChange={(e) => setFormData({ ...formData, teamImpact: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="high">High - Significant team synergy</option>
                <option value="medium">Medium - Positive contribution</option>
                <option value="low">Low - Individual contributor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mentorship Role</label>
              <select
                value={formData.mentorshipRole}
                onChange={(e) => setFormData({ ...formData, mentorshipRole: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="mentor">Mentor - Guides others</option>
                <option value="mentee">Mentee - Being guided</option>
                <option value="both">Both - Mentor & Mentee</option>
                <option value="none">None</option>
              </select>
            </div>

            {/* Team Leadership & Collective Impact Section */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-3 border-b pb-2">
                Team Leadership & Collective Impact
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Is Outsourced?</label>
              <select
                value={formData.isOutsourced.toString()}
                onChange={(e) => setFormData({ ...formData, isOutsourced: e.target.value === 'true' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="false">No - Direct team member</option>
                <option value="true">Yes - Outsourced/External</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Team Size Led/Managed</label>
              <input
                type="number"
                min="1"
                value={formData.teamSize}
                onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                placeholder="Number of people they lead or work with"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Impact Multiplier</label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={formData.impactMultiplier}
                onChange={(e) => setFormData({ ...formData, impactMultiplier: e.target.value })}
                placeholder="e.g., 2.5 = 2.5x more effective as team"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">How much more effective is the team vs individual work? (1 = no multiplier)</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Collective Achievements</label>
              <textarea
                value={formData.collectiveAchievements}
                onChange={(e) => setFormData({ ...formData, collectiveAchievements: e.target.value })}
                rows={3}
                placeholder="Describe what the team/collaboration achieved together that wouldn't be possible individually..."
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
        ) : labours.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No employees yet. Add your first one!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {labours.map((labour) => (
                  <tr key={labour.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{labour.employeeName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{labour.position}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{labour.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{labour.employeeType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      ${labour.salary.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          labour.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {labour.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(labour)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(labour.id)}
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
