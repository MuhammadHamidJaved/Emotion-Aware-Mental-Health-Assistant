'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Brain, TrendingUp, Calendar, Zap, Mic, Video, Type, ArrowRight, Flame, Sparkles, Music, Dumbbell, Quote, MessageCircle, Heart, ChevronRight } from 'lucide-react'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { EmotionType } from '@/types'
import { 
  apiGetCurrentUser,
  apiGetDashboardStats,
  apiGetMoodTrend,
  apiGetEmotionDistribution,
  apiGetRecentEntries,
  type DashboardStats,
  type MoodTrendData,
  type EmotionDistribution,
  type RecentEntry
} from '@/lib/api'
import { Loader2 } from 'lucide-react'
import ProtectedPage from '@/components/ProtectedPage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const EMOTION_COLORS: Record<string, string> = {
  happy: '#FCD34D', sad: '#6366F1', angry: '#EF4444', anxious: '#EC4899',
  calm: '#60A5FA', excited: '#F97316', loved: '#F472B6', confident: '#A855F7',
  frustrated: '#DC2626', grateful: '#34D399', lonely: '#6B7280', proud: '#8B5CF6',
  scared: '#FB923C', surprised: '#FBBF24', energetic: '#F59E0B', peaceful: '#3B82F6'
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [moodTrend, setMoodTrend] = useState<MoodTrendData[]>([])
  const [emotionDistribution, setEmotionDistribution] = useState<EmotionDistribution[]>([])
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([])
  const [userName, setUserName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getEmoji = (emotion: string) => {
    const emojiMap: Record<string, string> = {
      happy: '😊', sad: '😢', angry: '😠', anxious: '😰', calm: '😌', excited: '🤩',
      loved: '🥰', confident: '😎', frustrated: '😤', grateful: '🙏', lonely: '😔',
      proud: '😌', scared: '😨', surprised: '😮', energetic: '⚡', peaceful: '☮️'
    }
    return emojiMap[emotion] || '😊'
  }

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
        if (!accessToken) {
          setIsLoading(false)
          return
        }

        // Load user info
        try {
          const user = await apiGetCurrentUser(accessToken)
          const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim()
          setUserName(fullName || user.email)
        } catch {
          setUserName(null)
        }

        // Load all dashboard data in parallel, but handle errors independently
        const results = await Promise.allSettled([
          apiGetDashboardStats(accessToken),
          apiGetMoodTrend(accessToken, 7),
          apiGetEmotionDistribution(accessToken, 30),
          apiGetRecentEntries(accessToken, 5)
        ])

        // Handle each result independently - silently use defaults if endpoints don't exist
        if (results[0].status === 'fulfilled') {
          setStats(results[0].value)
        }
        // Stats will use defaults from useState if failed

        if (results[1].status === 'fulfilled') {
          setMoodTrend(results[1].value)
        }
        // Mood trend will use defaults if failed

        if (results[2].status === 'fulfilled') {
          setEmotionDistribution(results[2].value)
        }
        // Emotion distribution will use defaults if failed

        if (results[3].status === 'fulfilled') {
          setRecentEntries(results[3].value)
        } else {
          // Set empty array if it fails
          setRecentEntries([])
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  // Use default values if loading or no data
  const currentStreak = stats?.current_streak ?? 0
  const totalEntries = stats?.total_entries ?? 0
  const dominantEmotion = (stats?.dominant_emotion || 'neutral') as EmotionType
  const mlPredictions = stats?.ml_predictions_count ?? 0

  // Default mood trend data if empty
  const moodChartData = moodTrend.length > 0 ? moodTrend : Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return {
      date: date.toISOString().split('T')[0],
      avgValence: 5.0,
      avgArousal: 5.0
    }
  })

  // Default emotion distribution if empty
  const emotionChartData = emotionDistribution.length > 0 ? emotionDistribution : []

  const personalizedRecs = [
    { id: 1, type: 'music', title: 'Calming Piano', icon: Music, color: 'purple', desc: 'Based on recent anxiety' },
    { id: 2, type: 'exercise', title: '4-7-8 Breathing', icon: Dumbbell, color: 'orange', desc: 'Reduces stress' },
    { id: 3, type: 'quote', title: 'Daily Inspiration', icon: Quote, color: 'pink', desc: 'Comfort & reassurance' },
  ]

  // Check if user needs check-in (no entries today or last entry > 24 hours ago)
  const needsCheckIn = recentEntries.length === 0 || (recentEntries.length > 0 && (() => {
    const lastEntryDate = new Date(recentEntries[0].date)
    const hoursSinceLastEntry = (Date.now() - lastEntryDate.getTime()) / (1000 * 60 * 60)
    return hoursSinceLastEntry > 24
  })())

  // Get greeting message based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <ProtectedPage>
      <div className="space-y-4">
        {/* Assistant Greeting Card - PRIMARY FOCUS */}
        {!isLoading && (
          <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Assistant Avatar */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                
                {/* Greeting Content */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1">
                    {getGreeting()}{userName ? `, ${userName.split(' ')[0]}` : ''}! 👋
                  </h2>
                  <p className="text-neutral-700 mb-4">
                    I'm your emotion-aware assistant. I provide emotional support and personalized recommendations to help you understand and manage your feelings. <span className="text-xs italic text-neutral-600">(Note: I'm not a replacement for professional therapists or psychiatrists.)</span>
                  </p>

                  {/* Check-In Prompt */}
                  {needsCheckIn && (
                    <div className="mb-4 p-3 bg-white/80 rounded-lg border border-indigo-200">
                      <p className="text-sm font-medium text-neutral-800 mb-2">
                        💬 How are you feeling today?
                      </p>
                      <p className="text-xs text-neutral-600 mb-3">
                        {recentEntries.length === 0 
                          ? "Express yourself - I'll detect your emotions and provide personalized support. Choose any method you're comfortable with."
                          : "It's been a while since your last check-in. A quick update helps me provide better emotional support."
                        }
                      </p>
                      <p className="text-xs font-medium text-neutral-700 mb-2">Choose how you'd like to express yourself:</p>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <Link href="/check-in/new">
                          <div className="p-2 bg-white rounded-lg border border-neutral-200 hover:border-indigo-400 hover:shadow-sm transition-all cursor-pointer text-center">
                            <Type className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                            <p className="text-xs font-medium">Text</p>
                          </div>
                        </Link>
                        <Link href="/check-in/new?type=voice">
                          <div className="p-2 bg-white rounded-lg border border-neutral-200 hover:border-indigo-400 hover:shadow-sm transition-all cursor-pointer text-center">
                            <Mic className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                            <p className="text-xs font-medium">Voice</p>
                          </div>
                        </Link>
                        <Link href="/check-in/new?type=video">
                          <div className="p-2 bg-white rounded-lg border border-neutral-200 hover:border-indigo-400 hover:shadow-sm transition-all cursor-pointer text-center">
                            <Video className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                            <p className="text-xs font-medium">Video</p>
                          </div>
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* How Can I Help Section */}
                  <div className="mt-4">
                    <p className="text-sm font-medium text-neutral-700 mb-3">💡 How can I help you today?</p>
                    <div className="grid grid-cols-3 gap-2">
                      <Link href="/chat">
                        <div className="p-3 bg-white/80 rounded-lg border border-neutral-200 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer text-center">
                          <MessageCircle className="w-5 h-5 mx-auto mb-1.5 text-indigo-600" />
                          <p className="text-xs font-medium">Chat</p>
                        </div>
                      </Link>
                      <Link href="/recommendations">
                        <div className="p-3 bg-white/80 rounded-lg border border-neutral-200 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer text-center">
                          <Heart className="w-5 h-5 mx-auto mb-1.5 text-indigo-600" />
                          <p className="text-xs font-medium">Get Help</p>
                        </div>
                      </Link>
                      <Link href="/insights">
                        <div className="p-3 bg-white/80 rounded-lg border border-neutral-200 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer text-center">
                          <TrendingUp className="w-5 h-5 mx-auto mb-1.5 text-indigo-600" />
                          <p className="text-xs font-medium">Insights</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading State - Better Design */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-neutral-700">Loading your wellness data...</p>
              <p className="text-xs text-neutral-500 mt-1">Please wait a moment</p>
            </div>
          </div>
        )}

        {/* Stats Grid - Compact - Moved to Secondary Position */}
        {!isLoading && (
          <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <Badge variant="secondary" className="text-xs px-1.5 py-0">Active</Badge>
              </div>
              <div className="text-2xl font-bold">{currentStreak}</div>
              <p className="text-xs text-neutral-600">Day Streak</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-2xl font-bold">{totalEntries}</div>
              <p className="text-xs text-neutral-600">Total Entries</p>
            </CardContent>
          </Card>

          <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Sparkles className="w-5 h-5 text-pink-500" />
              </div>
              <div className="text-2xl font-bold">{getEmoji(dominantEmotion)}</div>
              <p className="text-xs text-neutral-600">Mood: {dominantEmotion}</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Brain className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{mlPredictions}</div>
              <p className="text-xs text-neutral-600">ML Predictions</p>
            </CardContent>
          </Card>
        </div>

        {/* Proactive Help Section - Show if concerning pattern detected */}
        {!isLoading && recentEntries.length >= 3 && dominantEmotion && ['anxious', 'sad', 'frustrated'].includes(dominantEmotion.toLowerCase()) && (
          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1 text-neutral-800">
                    💡 I've noticed a pattern
                  </h3>
                  <p className="text-xs text-neutral-700 mb-3">
                    You've been feeling <span className="font-medium capitalize">{dominantEmotion}</span> recently. This pattern is worth addressing. Would you like to:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/chat">
                      <Button size="sm" variant="outline" className="h-8 text-xs bg-white">
                        <MessageCircle className="w-3 h-3 mr-1.5" />
                        Chat about it
                      </Button>
                    </Link>
                    <Link href="/recommendations">
                      <Button size="sm" variant="outline" className="h-8 text-xs bg-white">
                        <Sparkles className="w-3 h-3 mr-1.5" />
                        Get help
                      </Button>
                    </Link>
                    <Link href="/insights">
                      <Button size="sm" variant="outline" className="h-8 text-xs bg-white">
                        <TrendingUp className="w-3 h-3 mr-1.5" />
                        View patterns
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Row - Compact - Moved to Secondary Position */}
        <div className="grid md:grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Mood Trend (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={moodChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="avgValence" stroke="#6366F1" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Emotion Distribution</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <ResponsiveContainer width="100%" height={180}>
                {emotionChartData.length > 0 ? (
                  <PieChart>
                    <Pie data={emotionChartData} dataKey="count" nameKey="emotion" cx="50%" cy="50%" outerRadius={70} label={false}>
                      {emotionChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={EMOTION_COLORS[entry.emotion?.toLowerCase() || ''] || '#6B7280'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                  </PieChart>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-neutral-500">
                    No emotion data yet
                  </div>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Entries - Compact */}
        <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Check-Ins</CardTitle>
              <Link href="/check-in">
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  View History <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {recentEntries.length > 0 ? (
              recentEntries.map((entry) => (
                <Link key={entry.id} href={`/check-in/${entry.id}`} className="flex items-start gap-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0`} style={{ backgroundColor: EMOTION_COLORS[entry.emotion] + '20' }}>
                    {getEmoji(entry.emotion)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-medium">{new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      {entry.confidence && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0">{entry.confidence}% confident</Badge>
                      )}
                    </div>
                    <p className="text-xs text-neutral-600 line-clamp-1">{entry.preview}</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-6 text-sm text-neutral-500">
                No check-ins yet. Start by expressing how you're feeling!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personalized Recommendations - Enhanced */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Personalized for You
              </CardTitle>
              <Link href="/recommendations">
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  View All <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
            <p className="text-xs text-neutral-600 mt-1">
              Based on your recent emotions, here's what might help:
            </p>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-3 gap-2">
              {personalizedRecs.map((rec) => {
                const Icon = rec.icon
                return (
                  <Link key={rec.id} href="/recommendations">
                    <div className="p-3 rounded-lg bg-white/80 border border-purple-100 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer text-center">
                      <div className={`w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${rec.color === 'purple' ? 'bg-purple-100' : rec.color === 'orange' ? 'bg-orange-100' : 'bg-pink-100'}`}>
                        <Icon className={`w-5 h-5 ${rec.color === 'purple' ? 'text-purple-600' : rec.color === 'orange' ? 'text-orange-600' : 'text-pink-600'}`} />
                      </div>
                      <p className="text-xs font-medium mb-0.5">{rec.title}</p>
                      <p className="text-xs text-neutral-500">{rec.desc}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Express Yourself - All Methods Equal */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Express Yourself</CardTitle>
            <p className="text-xs text-neutral-600 mt-1">
              Choose any method you're comfortable with - all are equally effective:
            </p>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-3 gap-2">
              <Link href="/check-in/new">
                <div className="p-3 rounded-lg border-2 border-neutral-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer text-center bg-white">
                  <Type className="w-5 h-5 mx-auto mb-1.5 text-indigo-600" />
                  <p className="text-xs font-medium mb-0.5">Text</p>
                  <p className="text-xs text-neutral-500">Quick & private</p>
                </div>
              </Link>
              <Link href="/check-in/new?type=voice">
                <div className="p-3 rounded-lg border-2 border-neutral-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer text-center bg-white">
                  <Mic className="w-5 h-5 mx-auto mb-1.5 text-indigo-600" />
                  <p className="text-xs font-medium mb-0.5">Voice</p>
                  <p className="text-xs text-neutral-500">Natural expression</p>
                </div>
              </Link>
              <Link href="/check-in/new?type=video">
                <div className="p-3 rounded-lg border-2 border-neutral-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer text-center bg-white">
                  <Video className="w-5 h-5 mx-auto mb-1.5 text-indigo-600" />
                  <p className="text-xs font-medium mb-0.5">Video</p>
                  <p className="text-xs text-neutral-500">Most accurate</p>
                </div>
              </Link>
            </div>
            <p className="text-xs text-neutral-500 mt-3 text-center italic">
              💡 We provide emotional support, not therapy. For professional help, please consult a licensed therapist or psychiatrist.
            </p>
          </CardContent>
        </Card>
        </>
        )}
      </div>
    </ProtectedPage>
  )
}
