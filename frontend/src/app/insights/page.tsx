'use client';

import { useState, useEffect } from 'react';
import { 
  AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Calendar, TrendingUp, Activity, BarChart3, Target, Brain, Sparkles, Loader2 } from 'lucide-react';
import { 
  apiGetInsightsOverview,
  apiGetInsightsMoodTimeline,
  type InsightsOverview,
  type MoodTimelineData
} from '@/lib/api';
import ProtectedPage from '@/components/ProtectedPage';

// Fallback data if no real data available
const MOOD_HISTORY_30_DAYS = [
  { date: 'Dec 10', valence: 6.2, arousal: 5.1, avgScore: 68 },
  { date: 'Dec 11', valence: 7.1, arousal: 6.3, avgScore: 72 },
  { date: 'Dec 12', valence: 5.8, arousal: 4.9, avgScore: 64 },
  { date: 'Dec 13', valence: 6.5, arousal: 5.8, avgScore: 70 },
  { date: 'Dec 14', valence: 7.8, arousal: 7.2, avgScore: 78 },
  { date: 'Dec 15', valence: 8.2, arousal: 7.8, avgScore: 82 },
  { date: 'Dec 16', valence: 7.5, arousal: 6.9, avgScore: 75 },
  { date: 'Dec 17', valence: 6.8, arousal: 6.1, avgScore: 71 },
  { date: 'Dec 18', valence: 5.2, arousal: 4.5, avgScore: 58 },
  { date: 'Dec 19', valence: 4.9, arousal: 4.2, avgScore: 55 },
  { date: 'Dec 20', valence: 6.1, arousal: 5.4, avgScore: 66 },
  { date: 'Dec 21', valence: 7.3, arousal: 6.7, avgScore: 74 },
  { date: 'Dec 22', valence: 8.1, arousal: 7.5, avgScore: 80 },
  { date: 'Dec 23', valence: 8.5, arousal: 8.1, avgScore: 85 },
  { date: 'Dec 24', valence: 7.9, arousal: 7.3, avgScore: 79 },
  { date: 'Dec 25', valence: 9.1, arousal: 8.7, avgScore: 90 },
  { date: 'Dec 26', valence: 8.8, arousal: 8.3, avgScore: 87 },
  { date: 'Dec 27', valence: 7.6, arousal: 7.1, avgScore: 76 },
  { date: 'Dec 28', valence: 6.9, arousal: 6.4, avgScore: 72 },
  { date: 'Dec 29', valence: 7.4, arousal: 6.8, avgScore: 74 },
  { date: 'Dec 30', valence: 8.0, arousal: 7.6, avgScore: 81 },
  { date: 'Dec 31', valence: 8.7, arousal: 8.2, avgScore: 86 },
  { date: 'Jan 01', valence: 9.2, arousal: 8.9, avgScore: 91 },
  { date: 'Jan 02', valence: 8.4, arousal: 7.9, avgScore: 83 },
  { date: 'Jan 03', valence: 7.8, arousal: 7.2, avgScore: 78 },
  { date: 'Jan 04', valence: 7.2, arousal: 6.6, avgScore: 73 },
  { date: 'Jan 05', valence: 8.1, arousal: 7.5, avgScore: 80 },
  { date: 'Jan 06', valence: 8.6, arousal: 8.0, avgScore: 85 },
  { date: 'Jan 07', valence: 7.9, arousal: 7.4, avgScore: 79 },
  { date: 'Jan 08', valence: 8.3, arousal: 7.8, avgScore: 82 },
];

// Hourly emotion patterns (24 hours)
const HOURLY_PATTERNS = [
  { hour: '00:00', happy: 12, calm: 45, anxious: 8, sad: 5 },
  { hour: '01:00', happy: 8, calm: 52, anxious: 6, sad: 4 },
  { hour: '02:00', happy: 5, calm: 58, anxious: 4, sad: 3 },
  { hour: '03:00', happy: 3, calm: 61, anxious: 3, sad: 2 },
  { hour: '04:00', happy: 4, calm: 59, anxious: 5, sad: 3 },
  { hour: '05:00', happy: 8, calm: 54, anxious: 7, sad: 4 },
  { hour: '06:00', happy: 15, calm: 48, anxious: 12, sad: 6 },
  { hour: '07:00', happy: 24, calm: 42, anxious: 18, sad: 8 },
  { hour: '08:00', happy: 35, calm: 38, anxious: 22, sad: 10 },
  { hour: '09:00', happy: 42, calm: 32, anxious: 28, sad: 12 },
  { hour: '10:00', happy: 48, calm: 28, anxious: 32, sad: 14 },
  { hour: '11:00', happy: 52, calm: 25, anxious: 35, sad: 16 },
  { hour: '12:00', happy: 58, calm: 22, anxious: 30, sad: 15 },
  { hour: '13:00', happy: 55, calm: 24, anxious: 28, sad: 14 },
  { hour: '14:00', happy: 51, calm: 26, anxious: 26, sad: 13 },
  { hour: '15:00', happy: 47, calm: 28, anxious: 24, sad: 12 },
  { hour: '16:00', happy: 44, calm: 30, anxious: 22, sad: 11 },
  { hour: '17:00', happy: 40, calm: 32, anxious: 20, sad: 10 },
  { hour: '18:00', happy: 38, calm: 35, anxious: 18, sad: 9 },
  { hour: '19:00', happy: 35, calm: 38, anxious: 16, sad: 8 },
  { hour: '20:00', happy: 32, calm: 42, anxious: 14, sad: 7 },
  { hour: '21:00', happy: 28, calm: 46, anxious: 12, sad: 6 },
  { hour: '22:00', happy: 22, calm: 50, anxious: 10, sad: 5 },
  { hour: '23:00', happy: 16, calm: 48, anxious: 9, sad: 5 },
];

// Weekly trends (4 weeks)
const WEEKLY_TRENDS = [
  { week: 'Week 1', avgMood: 65, entries: 12, positive: 58, negative: 42 },
  { week: 'Week 2', avgMood: 72, entries: 15, positive: 67, negative: 33 },
  { week: 'Week 3', avgMood: 78, entries: 18, positive: 74, negative: 26 },
  { week: 'Week 4', avgMood: 82, entries: 21, positive: 81, negative: 19 },
];

// Top emotions with counts
const TOP_EMOTIONS = [
  { emotion: 'happy', count: 523, percentage: 28 },
  { emotion: 'calm', count: 487, percentage: 26 },
  { emotion: 'grateful', count: 412, percentage: 22 },
  { emotion: 'confident', count: 356, percentage: 19 },
  { emotion: 'energetic', count: 298, percentage: 16 },
  { emotion: 'excited', count: 245, percentage: 13 },
  { emotion: 'anxious', count: 189, percentage: 10 },
  { emotion: 'neutral', count: 156, percentage: 8 },
];

const EMOTION_COLORS: Record<string, string> = {
  happy: '#eab308',
  calm: '#14b8a6',
  anxious: '#a855f7',
  sad: '#3b82f6',
  angry: '#ef4444',
  excited: '#f97316',
  neutral: '#6b7280',
  grateful: '#10b981',
  confident: '#f59e0b',
  energetic: '#facc15',
};

export default function InsightsPage() {
  const [dateRange, setDateRange] = useState('30d');
  const [overview, setOverview] = useState<InsightsOverview | null>(null);
  const [moodTimeline, setMoodTimeline] = useState<MoodTimelineData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert date range to days
  const getDaysFromRange = (range: string): number => {
    switch (range) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case 'all': return 365;
      default: return 30;
    }
  };

  useEffect(() => {
    const loadInsightsData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (!accessToken) {
          setIsLoading(false);
          return;
        }

        const days = getDaysFromRange(dateRange);

        // Load insights data
        const [overviewData, timelineData] = await Promise.allSettled([
          apiGetInsightsOverview(accessToken, days),
          apiGetInsightsMoodTimeline(accessToken, days)
        ]);

        if (overviewData.status === 'fulfilled') {
          setOverview(overviewData.value);
        } else {
          console.error('Failed to load overview:', overviewData.reason);
        }

        if (timelineData.status === 'fulfilled') {
          setMoodTimeline(timelineData.value);
        } else {
          console.error('Failed to load timeline:', timelineData.reason);
        }
      } catch (err) {
        console.error('Failed to load insights data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load insights data');
      } finally {
        setIsLoading(false);
      }
    };

    loadInsightsData();
  }, [dateRange]);

  // Use real data or defaults
  const overallMood = overview?.overall_mood ?? 50;
  const overallMoodChange = overview?.overall_mood_change ?? 0;
  const positiveTrend = overview?.positive_trend ?? 0;
  const positiveTrendStatus = overview?.positive_trend_status ?? 'Neutral';
  const avgEntriesPerDay = overview?.avg_entries_per_day ?? 0;
  const bestStreak = overview?.best_streak ?? 0;

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
            <div className="text-2xl font-bold">{overallMood}</div>
            <div className={`text-xs mt-1 ${overallMoodChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatChange(overallMoodChange)} from last period
            </div>
          </div>

          <div className="border border-neutral-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xs text-neutral-600">Positive Trend</div>
            </div>
            <div className="text-2xl font-bold">{positiveTrend}%</div>
            <div className={`text-xs mt-1 ${positiveTrendStatus === 'Improving' ? 'text-green-600' : 'text-red-600'}`}>
              {positiveTrendStatus}
            </div>
          </div>

          <div className="border border-neutral-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-xs text-neutral-600">Avg Entries/Day</div>
            </div>
            <div className="text-2xl font-bold">{avgEntriesPerDay}</div>
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
            <div className="text-2xl font-bold">{bestStreak}</div>
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
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={moodTimeline.length > 0 ? moodTimeline : MOOD_HISTORY_30_DAYS}>
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
                  interval={4}
                />
                <YAxis 
                  stroke="#6b7280" 
                  style={{ fontSize: '12px' }}
                  domain={[6, 10]}
                  ticks={[6, 7, 8, 9, 10]}
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
          </>
        )}
      </div>
    </ProtectedPage>
  );
}
