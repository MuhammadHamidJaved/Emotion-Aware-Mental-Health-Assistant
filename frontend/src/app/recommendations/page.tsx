'use client';

import { useState, useEffect, useCallback } from 'react';
import { Music, Dumbbell, Quote, Play, Check, Clock, TrendingUp, Sparkles, BookmarkPlus, Bookmark, Brain, Loader2, ExternalLink } from 'lucide-react';

import MusicPlayer from '@/components/MusicPlayer';
import { apiGetPersonalizedRecommendations, apiSendRecommendationFeedback } from '@/lib/api';

const EMOTION_OPTIONS = [
  { key: 'happy', label: 'Happy', emoji: '😊' },
  { key: 'sad', label: 'Sad', emoji: '😢' },
  { key: 'anxious', label: 'Anxious', emoji: '😰' },
  { key: 'calm', label: 'Calm', emoji: '😌' },
  { key: 'tired', label: 'Tired', emoji: '😴' },
  { key: 'frustrated', label: 'Frustrated', emoji: '😤' },
  { key: 'energetic', label: 'Energetic', emoji: '⚡' },
];

export default function PersonalizedRecommendationsPage() {
  const [bookmarkedMusic, setBookmarkedMusic] = useState<string[]>([]);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [savedQuotes, setSavedQuotes] = useState<string[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [emotionData, setEmotionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<string>('');

  // Build emotion query param for sub-page links
  const emotionQuery = selectedEmotion ? `?emotion=${selectedEmotion}` : '';

  // Fetch personalized recommendations from API
  const fetchFromAPI = useCallback(async (emotion: string) => {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!accessToken || !emotion) return false;

    try {
      const data = await apiGetPersonalizedRecommendations(accessToken, {
        emotion,
        types: ['music', 'exercise', 'quote'],
      });

      setRecommendations(data.recommendations || {});
      setEmotionData({
        dominant: data.emotion,
        confidence: null,
        lastUpdated: new Date().toLocaleString(),
        source: 'api',
      });
      return true;
    } catch (err) {
      console.error('Failed to fetch recommendations from API:', err);
      return false;
    }
  }, []);

  // Load recommendations from localStorage (set by emotion detection) or API
  useEffect(() => {
    const loadRecommendations = async () => {
      const stored = localStorage.getItem('lastRecommendations');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          const recommendations = data.recommendations || {};
          setRecommendations(recommendations);
          setEmotionData({
            dominant: data.emotion,
            confidence: data.confidence,
            lastUpdated: new Date(data.timestamp).toLocaleString(),
            source: 'detection',
          });
          setSelectedEmotion(data.emotion || '');
        } catch (e) {
          console.error('Error parsing stored recommendations:', e);
          setRecommendations({});
        }
      } else {
        setRecommendations({});
      }
      setIsLoading(false);
    };

    loadRecommendations();
  }, []);

  // Transform microservice recommendations to display format
  const musicData = recommendations?.music;
  
  let musicTracks: any[] = [];
  let playlistUrl: string | null = null;
  
  if (musicData) {
    playlistUrl = musicData.playlist_url || musicData.url || null;
    
    if (Array.isArray(musicData)) {
      musicTracks = musicData;
    } else if (musicData.tracks) {
      if (Array.isArray(musicData.tracks)) {
        musicTracks = musicData.tracks;
      } else if (typeof musicData.tracks === 'object') {
        musicTracks = Object.values(musicData.tracks).filter((item: any) => 
          item && (item.title || item.name || item.url)
        ) as any[];
      }
    }
  }
  
  // Build music recommendations
  const musicRecs: any[] = [];
  
  if (musicTracks.length > 0) {
    musicTracks.forEach((track: any, idx: number) => {
      // Handle album as flat string or nested object from different API versions
      const albumImage = typeof track.album === 'object' && track.album?.images?.[0]?.url
        ? track.album.images[0].url
        : null;
      const coverImage = track.image_url || albumImage || track.images?.[0]?.url || null;

      musicRecs.push({
        id: track.id || `track-${idx}`,
        title: track.title || track.name || 'Unknown Track',
        artist: track.artist || track.artists?.[0]?.name || 'Unknown Artist',
        duration: track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}` : (track.duration || '0:00'),
        bpm: track.bpm || 0,
        benefit: 'Personalized for your mood',
        coverColor: 'bg-purple-500',
        url: track.url || track.external_urls?.spotify || track.href || track.uri,
        preview_url: track.preview_url || track.preview || null,
        coverImage,
      });
    });
  }
  
  if (playlistUrl && musicTracks.length > 0) {
    musicRecs.push({
      id: 'playlist',
      title: 'View Full Playlist on Spotify',
      artist: 'Spotify',
      duration: 'Various',
      bpm: 0,
      benefit: 'See all recommended songs',
      coverColor: 'bg-indigo-500',
      url: playlistUrl,
      preview_url: null,
      isPlaylist: true
    });
  } else if (playlistUrl && musicTracks.length === 0) {
    musicRecs.push({
      id: 'playlist',
      title: 'Personalized Playlist',
      artist: 'Spotify',
      duration: 'Various',
      bpm: 0,
      benefit: 'Curated for your mood',
      coverColor: 'bg-purple-500',
      url: playlistUrl,
      preview_url: null,
      isPlaylist: true
    });
  }

  const exerciseRecs = recommendations?.exercise?.map((ex: any, idx: number) => ({
    id: `e${idx + 1}`,
    name: ex.name || 'Exercise',
    duration: ex.duration || '15 min',
    difficulty: ex.category || 'Beginner',
    calories: 20,
    icon: ex.icon || '🏃',
    benefit: ex.description || 'Good for your mood'
  })) || [];

  const quoteRecs: any[] = [];
  if (recommendations?.quote) {
    if (typeof recommendations.quote === 'string') {
      quoteRecs.push({ id: 'q1', text: recommendations.quote, author: 'Inspirational' });
    } else if (Array.isArray(recommendations.quote)) {
      recommendations.quote.forEach((q: any, idx: number) => {
        quoteRecs.push({
          id: `q${idx + 1}`,
          text: typeof q === 'string' ? q : q.text || q.quote || '',
          author: (typeof q === 'object' ? q.author : '') || 'Inspirational',
        });
      });
    }
  }

  const emotion = emotionData?.dominant || 'neutral';

  const toggleBookmark = (id: string, type: 'music' | 'quote') => {
    const wasBookmarked = type === 'music' ? bookmarkedMusic.includes(id) : savedQuotes.includes(id);
    
    if (type === 'music') {
      setBookmarkedMusic(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else {
      setSavedQuotes(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }

    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (accessToken) {
      apiSendRecommendationFeedback(accessToken, {
        recommendation_id: id,
        item_id: id,
        feedback_type: wasBookmarked ? 'dislike' : 'like',
        recommendation_type: type,
      }).catch(() => {});
    }
  };

  const toggleComplete = (id: string) => {
    const wasCompleted = completedExercises.includes(id);
    setCompletedExercises(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (accessToken) {
      apiSendRecommendationFeedback(accessToken, {
        recommendation_id: id,
        item_id: id,
        feedback_type: wasCompleted ? 'skip' : 'complete',
        recommendation_type: 'exercise',
      }).catch(() => {});
    }
  };

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      anxious: '#EC4899', sad: '#6366F1', happy: '#FCD34D', tired: '#6B7280', frustrated: '#EF4444',
      calm: '#14B8A6', energetic: '#F97316', neutral: '#9CA3AF',
    };
    return colors[emotion] || '#9CA3AF';
  };

  const getEmotionEmoji = (emotion: string) => {
    const emojis: Record<string, string> = {
      anxious: '😰', sad: '😢', happy: '😊', tired: '😴', frustrated: '😤',
      calm: '😌', energetic: '⚡', neutral: '😐',
    };
    return emojis[emotion] || '😐';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
        <p className="text-sm text-gray-500">Loading recommendations...</p>
      </div>
    );
  }

  const hasNoData = !recommendations || (
    musicRecs.length === 0 && exerciseRecs.length === 0 && quoteRecs.length === 0
  );

  if (hasNoData && !emotionData) {
    return (
      <div className="space-y-4">
        <div className="bg-white border-b border-gray-200 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">Emotional Support</h1>
              <p className="text-xs text-gray-500 mt-0.5">Get personalized recommendations for your mood</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-200" />
          <p className="text-sm text-gray-600 mb-5">Choose a mood or detect an emotion to get personalized recommendations</p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {EMOTION_OPTIONS.map((emo) => (
              <button
                key={emo.key}
                onClick={async () => {
                  setSelectedEmotion(emo.key);
                  setIsLoading(true);
                  await fetchFromAPI(emo.key);
                  setIsLoading(false);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <span>{emo.emoji}</span>
                <span>{emo.label}</span>
              </button>
            ))}
          </div>
          <a href="/check-in/new?type=video" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            Or go to Emotion Detection →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold leading-none">Emotional Support</h1>
          <p className="text-xs text-gray-500 mt-0.5">Personalized recommendations based on your detected emotions</p>
        </div>
      </div>

      {/* Emotion Status + Selector */}
      <div className="bg-white rounded-2xl border-2 p-4" style={{ borderColor: getEmotionColor(emotion) }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{getEmotionEmoji(emotion)}</div>
            <div>
              <h2 className="text-lg font-bold capitalize" style={{ color: getEmotionColor(emotion) }}>
                {emotion}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                <Brain className="w-3 h-3" />
                {emotionData?.confidence ? `${emotionData.confidence}% • ` : ''}
                {emotionData?.lastUpdated || 'Just now'}
                {emotionData?.source === 'api' && ' • via API'}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 justify-end">
            {EMOTION_OPTIONS.map((emo) => (
              <button
                key={emo.key}
                onClick={async () => {
                  setSelectedEmotion(emo.key);
                  setIsRefreshing(true);
                  await fetchFromAPI(emo.key);
                  setIsRefreshing(false);
                }}
                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                  (selectedEmotion || emotion) === emo.key
                    ? 'bg-black text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title={emo.label}
              >
                {emo.emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isRefreshing && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
          <span className="text-sm text-gray-500">Fetching personalized recommendations...</span>
        </div>
      )}

      {/* Three Columns - Compact */}
      <div className="grid lg:grid-cols-3 gap-3">
        {/* Music Player */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="flex items-center gap-2 px-4 pt-4 pb-2">
              <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                <Music className="w-3 h-3 text-purple-600" />
              </div>
              <span className="text-sm font-semibold">Music ({musicRecs.length})</span>
            </div>
            <div className="p-3">
              {musicRecs.length === 0 ? (
                <div className="text-center py-4 text-xs text-neutral-500">
                  <Music className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                  <p>No music recommendations available</p>
                  <a href={`/music${emotionQuery}`} className="text-indigo-600 hover:underline mt-1 inline-block">
                    Browse Music Library →
                  </a>
                </div>
              ) : (
                <MusicPlayer
                  track={musicRecs[currentTrackIndex] || musicRecs[0]}
                  playlist={musicRecs.filter((t: any) => !t.isPlaylist)}
                  onNext={() => {
                    let nextIndex = currentTrackIndex + 1;
                    while (nextIndex < musicRecs.length && musicRecs[nextIndex]?.isPlaylist) {
                      nextIndex++;
                    }
                    if (nextIndex < musicRecs.length) {
                      setCurrentTrackIndex(nextIndex);
                    }
                  }}
                  onPrevious={() => {
                    let prevIndex = currentTrackIndex - 1;
                    while (prevIndex >= 0 && musicRecs[prevIndex]?.isPlaylist) {
                      prevIndex--;
                    }
                    if (prevIndex >= 0) {
                      setCurrentTrackIndex(prevIndex);
                    }
                  }}
                  onTrackSelect={(selectedTrack) => {
                    const index = musicRecs.findIndex((t: any) => t.id === selectedTrack.id);
                    if (index !== -1) {
                      setCurrentTrackIndex(index);
                    }
                  }}
                />
              )}
              {playlistUrl && (
                <a
                  href={playlistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 mt-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open in Spotify
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Exercise - Compact */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
            <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
              <Dumbbell className="w-3 h-3 text-orange-600" />
            </div>
            <span className="text-sm font-semibold">Exercises ({exerciseRecs.length})</span>
          </div>
          <div className="p-3 space-y-2">
            {exerciseRecs.length === 0 ? (
              <div className="text-center py-4 text-xs text-neutral-500">
                <Dumbbell className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                <p>No exercise recommendations available</p>
                <a href={`/exercises${emotionQuery}`} className="text-indigo-600 hover:underline mt-1 inline-block">
                  Browse Exercises →
                </a>
              </div>
            ) : (
              exerciseRecs.map((exercise: any) => (
                <div key={exercise.id} className="bg-gray-50 rounded-xl border border-gray-100 p-2">
                  <div className="flex items-start gap-2">
                    <div className="text-2xl">{exercise.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-xs">{exercise.name}</h4>
                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        <span className="inline-block text-xs px-1.5 py-0.5 bg-gray-200 rounded-md font-medium">{exercise.difficulty}</span>
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
                    <a href={`/exercises${emotionQuery}`} className="flex-1 flex items-center justify-center gap-1 h-7 text-xs font-medium bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                      <Play className="w-3 h-3" />
                      Start
                    </a>
                    <button
                      onClick={() => toggleComplete(exercise.id)}
                      className={`h-7 px-2 text-xs rounded-lg border transition-colors ${completedExercises.includes(exercise.id) ? 'bg-green-50 text-green-600 border-green-200' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      {completedExercises.includes(exercise.id) ? <Check className="w-3 h-3" /> : 'Done'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quotes - Compact */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
            <div className="w-6 h-6 bg-pink-100 rounded-lg flex items-center justify-center">
              <Quote className="w-3 h-3 text-pink-600" />
            </div>
            <span className="text-sm font-semibold">Quotes ({quoteRecs.length})</span>
          </div>
          <div className="p-3 space-y-2">
            {quoteRecs.length === 0 ? (
              <div className="text-center py-4 text-xs text-neutral-500">
                <Quote className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                <p>No quote recommendations available</p>
                <a href={`/quotes${emotionQuery}`} className="text-indigo-600 hover:underline mt-1 inline-block">
                  Browse Quotes →
                </a>
              </div>
            ) : (
              quoteRecs.map((quote) => (
                <div key={quote.id} className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                  <Quote className="w-4 h-4 text-gray-300 mb-1.5" />
                  <p className="text-xs font-serif leading-relaxed text-neutral-800 mb-2">
                    &ldquo;{quote.text}&rdquo;
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-neutral-500">— {quote.author}</p>
                    <button
                      onClick={() => toggleBookmark(quote.id, 'quote')}
                      className="h-6 w-6 flex items-center justify-center rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      {savedQuotes.includes(quote.id) ? <Bookmark className="w-3 h-3 fill-current text-indigo-600" /> : <BookmarkPlus className="w-3 h-3 text-gray-500" />}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-3">
        <a href={`/music${emotionQuery}`} className="flex items-center justify-center gap-2 p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors text-sm font-medium">
          <Music className="w-4 h-4 text-purple-600" />
          Music Library
        </a>
        <a href={`/exercises${emotionQuery}`} className="flex items-center justify-center gap-2 p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors text-sm font-medium">
          <Dumbbell className="w-4 h-4 text-orange-600" />
          All Exercises
        </a>
        <a href={`/quotes${emotionQuery}`} className="flex items-center justify-center gap-2 p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors text-sm font-medium">
          <Quote className="w-4 h-4 text-pink-600" />
          Quote Library
        </a>
      </div>
    </div>
  );
}
