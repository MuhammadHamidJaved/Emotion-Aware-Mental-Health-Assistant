'use client';

import { useState } from 'react';
import { Music, Dumbbell, Quote, Play, Check, Clock, TrendingUp, Sparkles, BookmarkPlus, Bookmark, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const USER_EMOTION_DATA = {
  dominant: 'anxious',
  confidence: 72,
  recentEmotions: ['anxious', 'tired', 'frustrated'],
  trend: 'improving',
  lastUpdated: '2 hours ago'
};

const MUSIC_BY_EMOTION: Record<string, any[]> = {
  anxious: [
    { id: 'm1', title: 'Ocean Waves & Rain', artist: 'Nature Sounds', duration: '10:00', bpm: 60, benefit: 'Reduces anxiety', coverColor: 'bg-blue-500' },
    { id: 'm2', title: 'Deep Breathing Meditation', artist: 'Calm Collective', duration: '5:30', bpm: 58, benefit: 'Lowers heart rate', coverColor: 'bg-purple-500' },
    { id: 'm3', title: 'Peaceful Piano', artist: 'Relaxing Music', duration: '8:00', bpm: 62, benefit: 'Calms nerves', coverColor: 'bg-indigo-500' },
  ],
};

const EXERCISES_BY_EMOTION: Record<string, any[]> = {
  anxious: [
    { id: 'e1', name: '4-7-8 Breathing', duration: '5 min', difficulty: 'Beginner', calories: 10, icon: '🌬️', benefit: 'Calms nervous system' },
    { id: 'e2', name: 'Progressive Relaxation', duration: '15 min', difficulty: 'Beginner', calories: 20, icon: '😌', benefit: 'Releases tension' },
    { id: 'e3', name: 'Gentle Yoga Flow', duration: '20 min', difficulty: 'Beginner', calories: 80, icon: '🧘', benefit: 'Reduces stress' },
  ],
};

const QUOTES_BY_EMOTION: Record<string, any[]> = {
  anxious: [
    { id: 'q1', text: 'You are allowed to be both a masterpiece and a work in progress simultaneously.', author: 'Sophia Bush' },
    { id: 'q2', text: 'This too shall pass.', author: 'Persian Proverb' },
    { id: 'q3', text: 'Calm mind brings inner strength and self-confidence.', author: 'Dalai Lama' },
  ],
};

export default function PersonalizedRecommendationsPage() {
  const [bookmarkedMusic, setBookmarkedMusic] = useState<string[]>([]);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [savedQuotes, setSavedQuotes] = useState<string[]>([]);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);

  const emotion = USER_EMOTION_DATA.dominant;
  const musicRecs = MUSIC_BY_EMOTION[emotion] || [];
  const exerciseRecs = EXERCISES_BY_EMOTION[emotion] || [];
  const quoteRecs = QUOTES_BY_EMOTION[emotion] || [];

  const toggleBookmark = (id: string, type: 'music' | 'quote') => {
    if (type === 'music') {
      setBookmarkedMusic(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else {
      setSavedQuotes(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }
  };

  const toggleComplete = (id: string) => {
    setCompletedExercises(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      anxious: '#EC4899', sad: '#6366F1', happy: '#FCD34D', tired: '#6B7280', frustrated: '#EF4444',
    };
    return colors[emotion] || '#9CA3AF';
  };

  const getEmotionEmoji = (emotion: string) => {
    const emojis: Record<string, string> = {
      anxious: '😰', sad: '😢', happy: '😊', tired: '😴', frustrated: '😤',
    };
    return emojis[emotion] || '😐';
  };

  return (
    <div className="space-y-3">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-1">Emotional Support</h1>
        <p className="text-sm text-neutral-600">Personalized recommendations based on your detected emotions</p>
      </div>

      {/* Emotion Status - Compact */}
      <Card className="border-2" style={{ borderColor: getEmotionColor(emotion) }}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-3xl">{getEmotionEmoji(emotion)}</div>
              <div>
                <h2 className="text-lg font-bold capitalize" style={{ color: getEmotionColor(emotion) }}>
                  {emotion}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                  <Brain className="w-3 h-3" />
                  {USER_EMOTION_DATA.confidence}% • {USER_EMOTION_DATA.lastUpdated}
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              {USER_EMOTION_DATA.trend}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Three Columns - Compact */}
      <div className="grid lg:grid-cols-3 gap-3">
        {/* Music - Compact */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                <Music className="w-3 h-3 text-purple-600" />
              </div>
              Music ({musicRecs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {musicRecs.map((track) => (
              <div key={track.id} className="border rounded-lg p-2">
                <div className="flex gap-2">
                  <div className={`w-10 h-10 ${track.coverColor} rounded flex items-center justify-center flex-shrink-0`}>
                    <Music className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-xs truncate">{track.title}</h4>
                    <p className="text-xs text-neutral-500 truncate">{track.artist}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs text-neutral-400">{track.duration}</span>
                      <span className="text-xs text-neutral-300">•</span>
                      <span className="text-xs text-neutral-400">{track.bpm} BPM</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-1">✓ {track.benefit}</p>
                <div className="flex gap-1 mt-2">
                  <Button 
                    onClick={() => setPlayingTrack(playingTrack === track.id ? null : track.id)}
                    size="sm"
                    className="flex-1 h-7 text-xs"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    {playingTrack === track.id ? 'Playing' : 'Play'}
                  </Button>
                  <Button 
                    onClick={() => toggleBookmark(track.id, 'music')}
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                  >
                    {bookmarkedMusic.includes(track.id) ? <Bookmark className="w-3 h-3 fill-current" /> : <BookmarkPlus className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Exercise - Compact */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                <Dumbbell className="w-3 h-3 text-orange-600" />
              </div>
              Exercises ({exerciseRecs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {exerciseRecs.map((exercise) => (
              <div key={exercise.id} className="border rounded-lg p-2">
                <div className="flex items-start gap-2">
                  <div className="text-2xl">{exercise.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-xs">{exercise.name}</h4>
                    <div className="flex flex-wrap items-center gap-1 mt-0.5">
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">{exercise.difficulty}</Badge>
                      <span className="flex items-center gap-0.5 text-xs text-neutral-500">
                        <Clock className="w-3 h-3" />
                        {exercise.duration}
                      </span>
                      <span className="text-xs text-neutral-500">{exercise.calories} cal</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">✓ {exercise.benefit}</p>
                  </div>
                </div>
                <div className="flex gap-1 mt-2">
                  <Button size="sm" className="flex-1 h-7 text-xs">
                    <Play className="w-3 h-3 mr-1" />
                    Start
                  </Button>
                  <Button 
                    onClick={() => toggleComplete(exercise.id)}
                    size="sm"
                    variant="outline"
                    className={`h-7 px-2 text-xs ${completedExercises.includes(exercise.id) ? 'bg-green-50 text-green-600' : ''}`}
                  >
                    {completedExercises.includes(exercise.id) ? <Check className="w-3 h-3" /> : 'Done'}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quotes - Compact */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="w-6 h-6 bg-pink-100 rounded flex items-center justify-center">
                <Quote className="w-3 h-3 text-pink-600" />
              </div>
              Quotes ({quoteRecs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {quoteRecs.map((quote) => (
              <div key={quote.id} className="border rounded-lg p-3">
                <Quote className="w-5 h-5 text-neutral-300 mb-1.5" />
                <p className="text-xs font-serif leading-relaxed text-neutral-800 mb-2">
                  "{quote.text}"
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neutral-600">— {quote.author}</p>
                  <Button 
                    onClick={() => toggleBookmark(quote.id, 'quote')}
                    size="sm"
                    variant="outline"
                    className="h-6 w-6 p-0"
                  >
                    {savedQuotes.includes(quote.id) ? <Bookmark className="w-3 h-3 fill-current" /> : <BookmarkPlus className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
