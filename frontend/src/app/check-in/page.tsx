'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Activity, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { apiGetJournalEntries, type JournalEntry } from '@/lib/api'

const EMOTION_COLORS: Record<string, string> = {
  happy: '#FCD34D', sad: '#6366F1', angry: '#EF4444', anxious: '#EC4899',
  calm: '#60A5FA', excited: '#F97316', loved: '#F472B6', confident: '#A855F7',
  frustrated: '#DC2626', grateful: '#34D399', lonely: '#6B7280', proud: '#8B5CF6',
  scared: '#FB923C', surprised: '#FBBF24', energetic: '#F59E0B', peaceful: '#3B82F6'
}

export default function CheckInHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { getAccessToken } = useAuth()

  const getEmoji = (emotion: string) => {
    const emojiMap: Record<string, string> = {
      happy: '😊', sad: '😢', angry: '😠', anxious: '😰', calm: '😌', excited: '🤩',
      loved: '🥰', confident: '😎', frustrated: '😤', grateful: '🙏', lonely: '😔',
      proud: '😌', scared: '😨', surprised: '😮', energetic: '⚡', peaceful: '☮️'
    }
    return emojiMap[emotion] || '😊'
  }

  useEffect(() => {
    const loadEntries = async () => {
      const token = getAccessToken()
      if (!token) return
      
      setIsLoading(true)
      try {
        const data = await apiGetJournalEntries(token)
        // Filter out drafts and sort by date (newest first)
        const nonDraftEntries = data
          .filter(entry => !entry.is_draft)
          .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())
        setEntries(nonDraftEntries)
      } catch (error) {
        console.error('Error loading entries:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadEntries()
  }, [getAccessToken])

  const filteredEntries = entries.filter(entry => {
    const searchText = searchQuery.toLowerCase()
    const content = (entry.text_content || entry.transcription || entry.title || '').toLowerCase()
    const tags = (entry.tags || []).join(' ').toLowerCase()
    const emotion = (entry.emotion || '').toLowerCase()
    return content.includes(searchText) || tags.includes(searchText) || emotion.includes(searchText)
  })

  const getPreview = (entry: JournalEntry) => {
    const content = entry.text_content || entry.transcription || entry.title || ''
    return content.length > 100 ? content.substring(0, 100) + '...' : content
  }

  return (
    <div className="space-y-3">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Check-In History
          </h1>
          <p className="text-sm text-neutral-600 mt-1">Track your emotional journey over time • {filteredEntries.length} check-ins</p>
        </div>
      </div>


      {/* Entries List - Compact */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-neutral-400" />
            <p className="text-sm text-neutral-600">Loading entries...</p>
          </CardContent>
        </Card>
      ) : filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Activity className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
            <p className="text-neutral-600 mb-4">
              {searchQuery ? 'No entries found matching your search' : 'No check-ins yet. Start by expressing how you\'re feeling!'}
            </p>
            {!searchQuery && (
              <Link href="/check-in/new">
                <Button>Create Your First Check-In</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredEntries.map((entry) => (
            <Link key={entry.id} href={`/check-in/${entry.id}`}>
              <Card className="hover:border-black transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: (entry.emotion ? EMOTION_COLORS[entry.emotion] : '#9CA3AF') + '20' }}>
                      {getEmoji(entry.emotion || 'neutral')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm capitalize" style={{ color: entry.emotion ? EMOTION_COLORS[entry.emotion] : '#9CA3AF' }}>
                          {entry.emotion || 'neutral'}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-neutral-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(entry.entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      <p className="text-xs text-neutral-700 line-clamp-2">{getPreview(entry)}</p>
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        {entry.tags && entry.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                        {entry.emotion_confidence && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {Math.round(entry.emotion_confidence * 100)}% confident
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs px-1.5 py-0 capitalize">
                          {entry.entry_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

