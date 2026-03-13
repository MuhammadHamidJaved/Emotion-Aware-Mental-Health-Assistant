'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Activity, Loader2 } from 'lucide-react'
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
      <div className="bg-white border-b border-gray-200 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Check-In History</h1>
            <p className="text-xs text-gray-500">Track your emotional journey over time &bull; {filteredEntries.length} check-ins</p>
          </div>
        </div>
      </div>


      {/* Entries List - Compact */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">Loading entries...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-500 mb-4">
            {searchQuery ? 'No entries found matching your search' : 'No check-ins yet. Start by expressing how you\'re feeling!'}
          </p>
          {!searchQuery && (
            <Link href="/check-in/new">
              <button className="bg-black text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                Create Your First Check-In
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEntries.map((entry) => (
            <Link key={entry.id} href={`/check-in/${entry.id}`}>
              <div className="bg-white rounded-2xl border border-gray-200 hover:border-black transition-colors cursor-pointer">
                <div className="p-3">
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
                        <span key={idx} className="text-xs px-1.5 py-0.5 bg-gray-100 rounded-full text-gray-600">
                          {tag}
                        </span>
                      ))}
                      {entry.emotion_confidence && (
                        <span className="text-xs px-1.5 py-0.5 border border-gray-200 rounded-full text-gray-500">
                          {Math.round(entry.emotion_confidence * 100)}% confident
                        </span>
                      )}
                      <span className="text-xs px-1.5 py-0.5 border border-gray-200 rounded-full text-gray-500 capitalize">
                        {entry.entry_type}
                      </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

