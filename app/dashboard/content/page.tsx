'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Content {
  id: string;
  title: string;
  contentType: string;
  platform: string;
  publicationDate: string;
  audienceReach: number;
  viewCount: number;
  engagementRate: number;
  isRepeatable: boolean;
  distributionChannels: string;
  productionCost: number;
  revenueGenerated: number;
  contentUrl?: string;
  status: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ContentPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    contentType: 'video',
    platform: '',
    publicationDate: new Date().toISOString().split('T')[0],
    audienceReach: 0,
    viewCount: 0,
    engagementRate: 0,
    isRepeatable: true,
    distributionChannels: '',
    productionCost: 0,
    revenueGenerated: 0,
    contentUrl: '',
    status: 'published',
    description: '',
  });

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const response = await fetch('/api/content');
      if (response.ok) {
        const data = await response.json();
        setContents(data);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/content';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId 
        ? JSON.stringify({ ...formData, id: editingId, publicationDate: new Date(formData.publicationDate).toISOString() })
        : JSON.stringify({ ...formData, publicationDate: new Date(formData.publicationDate).toISOString() });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (response.ok) {
        fetchContents();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          title: '',
          contentType: 'video',
          platform: '',
          publicationDate: new Date().toISOString().split('T')[0],
          audienceReach: 0,
          viewCount: 0,
          engagementRate: 0,
          isRepeatable: true,
          distributionChannels: '',
          productionCost: 0,
          revenueGenerated: 0,
          contentUrl: '',
          status: 'published',
          description: '',
        });
      }
    } catch (error) {
      console.error('Error saving content:', error);
    }
  };

  const handleEdit = (content: Content) => {
    setEditingId(content.id);
    setFormData({
      title: content.title,
      contentType: content.contentType,
      platform: content.platform,
      publicationDate: new Date(content.publicationDate).toISOString().split('T')[0],
      audienceReach: content.audienceReach,
      viewCount: content.viewCount,
      engagementRate: content.engagementRate,
      isRepeatable: content.isRepeatable,
      distributionChannels: content.distributionChannels,
      productionCost: content.productionCost,
      revenueGenerated: content.revenueGenerated,
      contentUrl: content.contentUrl || '',
      status: content.status,
      description: content.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;
    
    try {
      const response = await fetch(`/api/content?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchContents();
      }
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({
      title: '',
      contentType: 'video',
      platform: '',
      publicationDate: new Date().toISOString().split('T')[0],
      audienceReach: 0,
      viewCount: 0,
      engagementRate: 0,
      isRepeatable: true,
      distributionChannels: '',
      productionCost: 0,
      revenueGenerated: 0,
      contentUrl: '',
      status: 'published',
      description: '',
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content & Audience Reach</h1>
          <p className="text-gray-600 mt-2">
            Maximize productivity and scale wealth through repeatable content that reaches massive audiences
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Content
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Content' : 'Add New Content'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border rounded text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content Type</label>
                <select
                  value={formData.contentType}
                  onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                  className="w-full p-2 border rounded text-gray-900"
                  required
                >
                  <option value="video">Video</option>
                  <option value="podcast">Podcast</option>
                  <option value="article">Article</option>
                  <option value="course">Course</option>
                  <option value="ebook">eBook</option>
                  <option value="webinar">Webinar</option>
                  <option value="social-post">Social Post</option>
                  <option value="newsletter">Newsletter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Platform</label>
                <input
                  type="text"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full p-2 border rounded text-gray-900"
                  placeholder="YouTube, LinkedIn, Medium, etc."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Publication Date</label>
                <input
                  type="date"
                  value={formData.publicationDate}
                  onChange={(e) => setFormData({ ...formData, publicationDate: e.target.value })}
                  className="w-full p-2 border rounded text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Audience Reach (Potential)</label>
                <input
                  type="number"
                  value={formData.audienceReach}
                  onChange={(e) => setFormData({ ...formData, audienceReach: Number(e.target.value) })}
                  className="w-full p-2 border rounded text-gray-900"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">View Count (Actual)</label>
                <input
                  type="number"
                  value={formData.viewCount}
                  onChange={(e) => setFormData({ ...formData, viewCount: Number(e.target.value) })}
                  className="w-full p-2 border rounded text-gray-900"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Engagement Rate (%)</label>
                <input
                  type="number"
                  value={formData.engagementRate}
                  onChange={(e) => setFormData({ ...formData, engagementRate: Number(e.target.value) })}
                  className="w-full p-2 border rounded text-gray-900"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Distribution Channels</label>
                <input
                  type="text"
                  value={formData.distributionChannels}
                  onChange={(e) => setFormData({ ...formData, distributionChannels: e.target.value })}
                  className="w-full p-2 border rounded text-gray-900"
                  placeholder="YouTube, Instagram, TikTok, Website"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Production Cost ($)</label>
                <input
                  type="number"
                  value={formData.productionCost}
                  onChange={(e) => setFormData({ ...formData, productionCost: Number(e.target.value) })}
                  className="w-full p-2 border rounded text-gray-900"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Revenue Generated ($)</label>
                <input
                  type="number"
                  value={formData.revenueGenerated}
                  onChange={(e) => setFormData({ ...formData, revenueGenerated: Number(e.target.value) })}
                  className="w-full p-2 border rounded text-gray-900"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content URL</label>
                <input
                  type="url"
                  value={formData.contentUrl}
                  onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                  className="w-full p-2 border rounded text-gray-900"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2 border rounded text-gray-900"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isRepeatable}
                  onChange={(e) => setFormData({ ...formData, isRepeatable: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium">Evergreen Content (Repeatable Reach)</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border rounded text-gray-900"
                rows={3}
                placeholder="Brief description of the content..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {editingId ? 'Update Content' : 'Add Content'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Platform
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reach
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Views
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Engagement
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Revenue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contents.map((content) => (
              <tr key={content.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{content.title}</div>
                  {content.isRepeatable && (
                    <span className="text-xs text-green-600">Evergreen</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {content.contentType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {content.platform}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {content.audienceReach.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {content.viewCount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {content.engagementRate.toFixed(2)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${content.revenueGenerated.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    content.status === 'published' ? 'bg-green-100 text-green-800' :
                    content.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {content.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(content)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(content.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {contents.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No content yet. Create your first piece of content to reach massive audiences!
          </div>
        )}
      </div>
    </div>
  );
}
