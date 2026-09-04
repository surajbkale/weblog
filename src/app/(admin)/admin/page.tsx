'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { AdminStatsResponse } from '@/types/admin';
import { useToast } from '@/context/ToastContext';
import { Users, FileText, CheckCircle2, MessageCircle, Heart, Eye, TrendingUp } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    adminApi.getStats()
      .then(res => setStats(res.data.data))
      .catch(() => toast.error('Failed to load dashboard statistics'))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, trend: stats.newUsersLast7Days, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Total Posts', value: stats.totalPosts, trend: stats.newPostsLast7Days, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Published Posts', value: stats.totalPublished, trend: null, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Total Comments', value: stats.totalComments, trend: stats.newCommentsLast7Days, icon: MessageCircle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Total Likes', value: stats.totalLikes, trend: null, icon: Heart, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: 'Total Views', value: stats.totalViews, trend: null, icon: Eye, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Platform metrics and activity at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value.toLocaleString()}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
            
            {stat.trend !== null && (
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">+{stat.trend}</span>
                <span className="text-gray-400 ml-2">in last 7 days</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-600 text-right">
        Last computed: {new Date(stats.computedAt).toLocaleString()}
      </div>
    </div>
  );
}
