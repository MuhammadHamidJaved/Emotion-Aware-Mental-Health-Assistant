'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Calendar, TrendingUp, Activity, BarChart3, Target, Sparkles, Loader2 } from 'lucide-react';
import { 
  apiGetInsightsOverview,
  apiGetInsightsMoodTimeline,
  type InsightsOverview,
  type MoodTimelineData
} from '@/lib/api';
import ProtectedPage from '@/components/ProtectedPage';

// Lazy load recharts components for better performance
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false });

// Fallback data if no real data available - memoized
const MOOD_HISTORY_FALLBACK = [
  { date: 'Day 1', valence: 6.5, arousal: 5.5, avgScore: 65 },
  { date: 'Day 2', valence: 7.0, arousal: 6.0, avgScore: 70 },
  { date: 'Day 3', valence: 6.8, arousal: 5.8, avgScore: 68 },
  { date: 'Day 4', valence: 7.5, arousal: 6.5, avgScore: 75 },
  { date: 'Day 5', valence: 8.0, arousal: 7.0, avgScore: 80 },
];

export default function InsightsPage() {
  const [dateRange, setDateRange] = useState('30d');
  const [overview, setOverview] = useState<InsightsOverview | null>(null);
  const [moodTimeline, setMoodTimeline] = useState<MoodTimelineData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert date range to days - memoized
  const getDaysFromRange = useCallback((range: string): number => {
    switch (range) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case 'all': return 365;
      default: return 30;
    }
  }, []);

  // Fetch data with debouncing
  useEffect(() => {
    let isCancelled = false;

    const loadInsightsData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (!accessToken || isCancelled) {
          setIsLoading(false);
          return;
        }

        const days = getDaysFromRange(dateRange);

        // Load insights data with increased timeout (30 seconds)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 30000)
        );

        const [overviewData, timelineData] = await Promise.allSettled([
          Promise.race([apiGetInsightsOverview(accessToken, days), timeoutPromise]),
          Promise.race([apiGetInsightsMoodTimeline(accessToken, days), timeoutPromise])
        ]);

        if (isCancelled) return;

        if (overviewData.status === 'fulfilled') {
          setOverview(overviewData.value as InsightsOverview);
        } else {
          console.error('Failed to load overview:', overviewData.reason);
        }

        if (timelineData.status === 'fulfilled') {
          setMoodTimeline(timelineData.value as MoodTimelineData[]);
        } else {
          console.error('Failed to load timeline:', timelineData.reason);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to load insights data:', err);
          setError(err instanceof Error ? err.message : 'Failed to load insights data');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(loadInsightsData, 300); // Debounce 300ms

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [dateRange, getDaysFromRange]);

  // Memoize computed values
  const stats = useMemo(() => ({
    overallMood: overview?.overall_mood ?? 50,
    overallMoodChange: overview?.overall_mood_change ?? 0,
    positiveTrend: overview?.positive_trend ?? 0,
    positiveTrendStatus: overview?.positive_trend_status ?? 'Neutral',
    avgEntriesPerDay: overview?.avg_entries_per_day ?? 0,
    bestStreak: overview?.best_streak ?? 0,
  }), [overview]);

  // Memoize chart data
  const chartData = useMemo(() => 
    moodTimeline.length > 0 ? moodTimeline : MOOD_HISTORY_FALLBACK,
    [moodTimeline]
  );

  // Format change with + or -
  const formatChange = (change: number) => {
    if (change > 0) return `+${change}`;
    if (change < 0) return `${change}`;
    return '0';
  };

  return (
    <ProtectedPage>
      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Analytics & Insights</h1>
            <p className="text-sm text-neutral-600 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              ML-powered emotional pattern analysis
            </p>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neutral-400" />
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        )}

        {!isLoading && (
          <>
        {/* Quick Stats - Matching Image Design */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="border border-neutral-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="text-xs text-neutral-600">Overall Mood</div>
            </div>
            <div className="text-2xl font-bold">{stats.overallMood}</div>
            <div className={`text-xs mt-1 ${stats.overallMoodChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatChange(stats.overallMoodChange)} from last period
            </div>
          </div>

          <div className="border border-neutral-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xs text-neutral-600">Positive Trend</div>
            </div>
            <div className="text-2xl font-bold">{stats.positiveTrend}%</div>
            <div className={`text-xs mt-1 ${stats.positiveTrendStatus === 'Improving' ? 'text-green-600' : 'text-red-600'}`}>
              {stats.positiveTrendStatus}
            </div>
          </div>

          <div className="border border-neutral-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-xs text-neutral-600">Avg Entries/Day</div>
            </div>
            <div className="text-2xl font-bold">{stats.avgEntriesPerDay}</div>
            <div className="text-xs text-neutral-600 mt-1">
              {dateRange === '7d' ? 'Last 7 days' : 
               dateRange === '30d' ? 'Last 30 days' : 
               dateRange === '90d' ? 'Last 90 days' : 'All time'}
            </div>
          </div>

          <div className="border border-neutral-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-xs text-neutral-600">Best Streak</div>
            </div>
            <div className="text-2xl font-bold">{stats.bestStreak}</div>
            <div className="text-xs text-neutral-600 mt-1">days</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="space-y-8">
          {/* 1. Mood History Timeline (Area Chart) */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Mood History Timeline
            </h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#000000" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorArousal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6b7280" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280" 
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    style={{ fontSize: '12px' }}
                    domain={[0, 10]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="valence" 
                    stroke="#000000" 
                    strokeWidth={2}
                    fill="url(#colorValence)" 
                    name="Valence (Positivity)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="arousal" 
                    stroke="#6b7280" 
                    strokeWidth={2}
                    fill="url(#colorArousal)" 
                    name="Arousal (Energy)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </ProtectedPage>
  );
}
