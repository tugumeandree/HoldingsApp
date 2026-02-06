'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Building2, Users, DollarSign, Cpu, FileText, Briefcase, FileVideo } from 'lucide-react';

interface Stats {
  lands: number;
  labours: number;
  capitals: number;
  technologies: number;
  data: number;
  businesses: number;
  contents: number;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats>({
    lands: 0,
    labours: 0,
    capitals: 0,
    technologies: 0,
    data: 0,
    businesses: 0,
    contents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      title: 'Land Assets',
      value: stats.lands,
      icon: Building2,
      color: 'bg-green-500',
      href: '/dashboard/land',
    },
    {
      title: 'People & Teams',
      value: stats.labours,
      icon: Users,
      color: 'bg-blue-500',
      href: '/dashboard/labour',
    },
    {
      title: 'Capital & Financial Strategy',
      value: stats.capitals,
      icon: DollarSign,
      color: 'bg-yellow-500',
      href: '/dashboard/capital',
    },
    {
      title: 'Technology & Automation',
      value: stats.technologies,
      icon: Cpu,
      color: 'bg-purple-500',
      href: '/dashboard/technology',
    },
    {
      title: 'Data',
      value: stats.data,
      icon: FileText,
      color: 'bg-pink-500',
      href: '/dashboard/information',
    },
    {
      title: 'Businesses',
      value: stats.businesses,
      icon: Briefcase,
      color: 'bg-indigo-500',
      href: '/dashboard/businesses',
    },
    {
      title: 'Content & Audience',
      value: stats.contents,
      icon: FileVideo,
      color: 'bg-red-500',
      href: '/dashboard/content',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of your holding company resources</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading stats...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <a
                key={card.title}
                href={card.href}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{card.value}</div>
                </div>
                <h3 className="text-gray-700 font-semibold">{card.title}</h3>
              </a>
            );
          })}
        </div>
      )}

      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="/dashboard/land"
            className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors text-center"
          >
            <div className="font-semibold text-gray-900 mb-1">Add Land Asset</div>
            <div className="text-sm text-gray-600">Register new property</div>
          </a>
          <a
            href="/dashboard/labour"
            className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors text-center"
          >
            <div className="font-semibold text-gray-900 mb-1">Add Team Member</div>
            <div className="text-sm text-gray-600">Build through collaboration</div>
          </a>
          <a
            href="/dashboard/capital"
            className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors text-center"
          >
            <div className="font-semibold text-gray-900 mb-1">Deploy Capital</div>
            <div className="text-sm text-gray-600">Fund growth & scale operations</div>
          </a>
          <a
            href="/dashboard/technology"
            className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors text-center"
          >
            <div className="font-semibold text-gray-900 mb-1">Add Technology</div>
            <div className="text-sm text-gray-600">Scale through automation & AI</div>
          </a>
          <a
            href="/dashboard/information"
            className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors text-center"
          >
            <div className="font-semibold text-gray-900 mb-1">Add Information</div>
            <div className="text-sm text-gray-600">Store important documents</div>
          </a>
          <a
            href="/dashboard/businesses"
            className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors text-center"
          >
            <div className="font-semibold text-gray-900 mb-1">Add Business</div>
            <div className="text-sm text-gray-600">Register business entity</div>
          </a>
          <a
            href="/dashboard/content"
            className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors text-center"
          >
            <div className="font-semibold text-gray-900 mb-1">Create Content</div>
            <div className="text-sm text-gray-600">Scale through audience reach</div>
          </a>
        </div>
      </div>
    </div>
  );
}
