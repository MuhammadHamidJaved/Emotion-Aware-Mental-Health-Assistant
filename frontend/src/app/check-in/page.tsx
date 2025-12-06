'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Activity } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const EMOTION_COLORS: Record<string, string> = {
  happy: '#FCD34D', sad: '#6366F1', angry: '#EF4444', anxious: '#EC4899',
  calm: '#60A5FA', excited: '#F97316', loved: '#F472B6', confident: '#A855F7',
  frustrated: '#DC2626', grateful: '#34D399', lonely: '#6B7280', proud: '#8B5CF6',
  scared: '#FB923C', surprised: '#FBBF24', energetic: '#F59E0B', peaceful: '#3B82F6'
}

export default function CheckInHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const getEmoji = (emotion: string) => {
    const emojiMap: Record<string, string> = {
      happy: '😊', sad: '😢', angry: '😠', anxious: '😰', calm: '😌', excited: '🤩',
      loved: '🥰', confident: '😎', frustrated: '😤', grateful: '🙏', lonely: '😔',
      proud: '😌', scared: '😨', surprised: '😮', energetic: '⚡', peaceful: '☮️'
    }
    return emojiMap[emotion] || '😊'
  }

  const entries = [
    { id: 1, date: '2025-01-22 14:30', type: 'text', emotion: 'happy', preview: 'Had a great day at work! Finally finished the project and got positive feedback...', tags: ['work', 'achievement'], confidence: 94 },
    { id: 2, date: '2025-01-21 20:15', type: 'voice', emotion: 'calm', preview: 'Evening meditation session was very peaceful. Feeling centered and relaxed...', tags: ['meditation', 'wellness'], confidence: 87 },
    { id: 3, date: '2025-01-20 09:45', type: 'text', emotion: 'excited', preview: 'Got accepted into the conference! Cannot wait to present my research...', tags: ['achievement', 'research'], confidence: 91 },
    { id: 4, date: '2025-01-19 16:20', type: 'video', emotion: 'anxious', preview: 'Worried about the upcoming presentation. Need to practice more...', tags: ['work', 'stress'], confidence: 89 },
    { id: 5, date: '2025-01-18 22:00', type: 'text', emotion: 'grateful', preview: 'Thankful for my supportive team and family. They always have my back...', tags: ['gratitude', 'family'], confidence: 92 }
  ]

  const filteredEntries = entries.filter(entry => {
    return entry.preview.toLowerCase().includes(searchQuery.toLowerCase())
  })

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
      <div className="space-y-2">
        {filteredEntries.map((entry) => (
          <Link key={entry.id} href={`/check-in/${entry.id}`}>
            <Card className="hover:border-black transition-colors">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: EMOTION_COLORS[entry.emotion] + '20' }}>
                    {getEmoji(entry.emotion)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm capitalize" style={{ color: EMOTION_COLORS[entry.emotion] }}>
                        {entry.emotion}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-neutral-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <p className="text-xs text-neutral-700 line-clamp-2">{entry.preview}</p>
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      {entry.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs px-1.5 py-0">
                          {tag}
                        </Badge>
                      ))}
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {entry.confidence}% confident
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

