'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Activity, Calendar, Loader2 } from 'lucide-react'
import PageHeading from '@/components/PageHeading'
import { useAuth } from '@/contexts/auth-context'
import { apiGetCheckInEntries, type CheckInEntry } from '@/lib/api'
import { getPendingLocalEntries, type LocalCheckInRecord } from '@/lib/local-check-in-store'

const EMOTION_COLORS: Record<string, string> = {
  happy: '#FCD34D', sad: '#6366F1', angry: '#EF4444', anxious: '#EC4899',
  calm: '#60A5FA', excited: '#F97316', loved: '#F472B6', confident: '#A855F7',
  frustrated: '#DC2626', grateful: '#34D399', lonely: '#6B7280', proud: '#8B5CF6',
  scared: '#FB923C', surprised: '#FBBF24', energetic: '#F59E0B', peaceful: '#3B82F6'
}

type HistoryEntry = Omit<CheckInEntry, 'id'> & {
  id: string | number
  pendingDeviceSync?: boolean
}

function localRecordToEntry(rec: LocalCheckInRecord): HistoryEntry {
  const p = rec.payload
  const entryType = (p.entry_type as string) || 'text'
  const entryDate = (p.entry_date as string) || new Date(rec.createdAt).toISOString()
  return {
    id: `local-${rec.localId}`,
    entry_type: entryType as CheckInEntry['entry_type'],
    title: (p.title as string) || undefined,
    text_content: (p.text_content as string) || undefined,
    transcription: (p.transcription as string) || undefined,
    emotion: (p.emotion as string) || undefined,
    emotion_confidence: typeof p.emotion_confidence === 'number' ? p.emotion_confidence : undefined,
    tags: (p.tags as string[]) || [],
    entry_date: entryDate,
    created_at: new Date(rec.createdAt).toISOString(),
    duration: typeof p.duration === 'number' ? p.duration : undefined,
    is_draft: false,
    pendingDeviceSync: true,
  }
}

export default function CheckInHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { getAccessToken, user, isLoading: authLoading } = useAuth()

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
      if (authLoading) return
      const token = getAccessToken()
      if (!token || !user?.id) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const [cloudRaw, pendingLocal] = await Promise.all([
          apiGetCheckInEntries(token),
          getPendingLocalEntries(user.id),
        ])
        const cloudEntries: HistoryEntry[] = cloudRaw
          .filter((entry) => !entry.is_draft)
          .map((e) => ({ ...e, id: e.id, pendingDeviceSync: false }))
        const localEntries = pendingLocal.map(localRecordToEntry)
        const merged = [...cloudEntries, ...localEntries].sort(
          (a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
        )
        setEntries(merged)
      } catch (error) {
        console.error('Error loading entries:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadEntries()
  }, [getAccessToken, user?.id, authLoading])

  const filteredEntries = entries.filter(entry => {
    const searchText = searchQuery.toLowerCase()
    const content = (entry.text_content || entry.transcription || entry.title || '').toLowerCase()
    const tags = (entry.tags || []).join(' ').toLowerCase()
    const emotion = (entry.emotion || '').toLowerCase()
    return content.includes(searchText) || tags.includes(searchText) || emotion.includes(searchText)
  })

  const getPreview = (entry: HistoryEntry) => {
    const content = entry.text_content || entry.transcription || entry.title || ''
    return content.length > 100 ? content.substring(0, 100) + '...' : content
  }

  return (
    <div className="space-y-3">
      <PageHeading
        icon={Activity}
        title="Check-In History"
        subtitle={`Track your emotional journey over time • ${filteredEntries.length} check-in${filteredEntries.length !== 1 ? 's' : ''}`}
      />


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
            <Link key={String(entry.id)} href={`/check-in/${entry.id}`}>
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
                      {entry.pendingDeviceSync && (
                        <span className="text-xs px-1.5 py-0.5 border border-amber-200 bg-amber-50 text-amber-800 rounded-full">
                          Device only
                        </span>
                      )}
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

