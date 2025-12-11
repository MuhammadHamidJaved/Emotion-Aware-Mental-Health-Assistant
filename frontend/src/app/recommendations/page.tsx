'use client';

import { useState, useEffect } from 'react';
import { Music, Dumbbell, Quote, Play, Check, Clock, TrendingUp, Sparkles, BookmarkPlus, Bookmark, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MusicPlayer from '@/components/MusicPlayer';

export default function PersonalizedRecommendationsPage() {
  const [bookmarkedMusic, setBookmarkedMusic] = useState<string[]>([]);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [savedQuotes, setSavedQuotes] = useState<string[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [emotionData, setEmotionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load recommendations from localStorage (set by emotion detection)
  useEffect(() => {
    const stored = localStorage.getItem('lastRecommendations');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        console.log('Loaded recommendations data:', data);
        console.log('Music data:', data.recommendations?.music);
        
        // Ensure recommendations is an object, not null
        const recommendations = data.recommendations || {};
        setRecommendations(recommendations);
        setEmotionData({
          dominant: data.emotion,
          confidence: data.confidence,
          lastUpdated: new Date(data.timestamp).toLocaleString()
        });
      } catch (e) {
        console.error('Error parsing stored recommendations:', e);
        // Set empty recommendations on error
        setRecommendations({});
      }
    } else {
      // No stored data, set empty recommendations
      setRecommendations({});
    }
    setIsLoading(false);
  }, []);

  // Transform microservice recommendations to display format
  const musicData = recommendations?.music;
  console.log('Processing music data:', musicData);
  console.log('Full recommendations object:', recommendations);
  
  let musicTracks: any[] = [];
  let playlistUrl: string | null = null;
  
  if (musicData) {
    // Get playlist URL if available
    playlistUrl = musicData.playlist_url || musicData.url || null;
    
    // Extract tracks - handle different possible structures
    if (Array.isArray(musicData)) {
      // If music is directly an array
      musicTracks = musicData;
    } else if (musicData.tracks) {
      // If tracks property exists
      if (Array.isArray(musicData.tracks)) {
        musicTracks = musicData.tracks;
        console.log('Found tracks array with', musicTracks.length, 'tracks');
      } else if (typeof musicData.tracks === 'object') {
        // If tracks is an object, try to extract array from it
        musicTracks = Object.values(musicData.tracks).filter((item: any) => 
          item && (item.title || item.name || item.url)
        ) as any[];
        console.log('Extracted tracks from object:', musicTracks.length);
      }
    }
    
    // Debug: Log what we found
    if (musicTracks.length > 0) {
      console.log('Sample track:', musicTracks[0]);
    }
    
    // If no tracks but we have playlist URL, that's okay - we'll show playlist
    // But log a warning
    if (musicTracks.length === 0 && playlistUrl) {
      console.warn('No individual tracks found, only playlist URL available');
    }
  } else {
    console.warn('No music data in recommendations');
  }
  
  console.log('Extracted music tracks:', musicTracks);
  console.log('Playlist URL:', playlistUrl);
  
  // Build music recommendations - prioritize individual tracks
  const musicRecs: any[] = [];
  
  // Add individual tracks first (these are the actual songs)
  if (musicTracks.length > 0) {
    musicTracks.forEach((track: any, idx: number) => {
      musicRecs.push({
        id: `track-${idx}`,
        title: track.title || track.name || 'Unknown Track',
        artist: track.artist || track.artists?.[0]?.name || track.artists || 'Unknown Artist',
        duration: track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}` : (track.duration || '0:00'),
        bpm: track.bpm || 0,
        benefit: 'Personalized for your mood',
        coverColor: 'bg-purple-500',
        url: track.url || track.external_urls?.spotify || track.href || track.uri,
        preview_url: track.preview_url || track.preview || null,
        coverImage: track.album?.images?.[0]?.url || track.images?.[0]?.url || null
      });
    });
  }
  
  // Only add playlist as a separate item if we have tracks AND a playlist URL
  // Don't add it if we only have playlist URL (no tracks) - tracks should be shown instead
  if (playlistUrl && musicTracks.length > 0) {
    // We have tracks, add playlist as an additional option at the end
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
    // Only playlist, no tracks - show as main item
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
  
  console.log('Final music recommendations:', musicRecs);
  console.log('Number of tracks:', musicRecs.length);

  const exerciseRecs = recommendations?.exercise?.map((ex: any, idx: number) => ({
    id: `e${idx + 1}`,
    name: ex.name || 'Exercise',
    duration: '15 min', // Default duration
    difficulty: ex.category || 'Beginner',
    calories: 20, // Default calories
    icon: '🏃',
    benefit: ex.description || 'Good for your mood'
  })) || [];

  const quoteRecs = recommendations?.quote ? [{
    id: 'q1',
    text: recommendations.quote,
    author: 'Inspirational'
  }] : [];

  const emotion = emotionData?.dominant || 'neutral';

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

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="mb-4">
          <h1 className="text-2xl font-bold mb-1">Emotional Support</h1>
          <p className="text-sm text-neutral-600">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  if (!recommendations && !emotionData) {
    return (
      <div className="space-y-3">
        <div className="mb-4">
          <h1 className="text-2xl font-bold mb-1">Emotional Support</h1>
          <p className="text-sm text-neutral-600">No recommendations available yet</p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
            <p className="text-neutral-600 mb-4">Detect an emotion first to get personalized recommendations</p>
            <a href="/check-in/new?type=video" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Go to Emotion Detection →
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-1">Emotional Support</h1>
        <p className="text-sm text-neutral-600">Personalized recommendations based on your detected emotions</p>
      </div>

      {/* Emotion Status - Compact */}
      {emotionData && (
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
                    {emotionData.confidence}% • {emotionData.lastUpdated || 'Just now'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Three Columns - Compact */}
      <div className="grid lg:grid-cols-3 gap-3">
        {/* Music Player - Full Width on Large Screens */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                  <Music className="w-3 h-3 text-purple-600" />
                </div>
                Music ({musicRecs.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              {musicRecs.length === 0 ? (
                <div className="text-center py-4 text-xs text-neutral-500">
                  <Music className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                  <p>No music recommendations available</p>
                </div>
              ) : (
                <MusicPlayer
                  track={musicRecs[currentTrackIndex] || musicRecs[0]}
                  playlist={musicRecs.filter((t: any) => !t.isPlaylist)} // Only show actual tracks, not playlist item
                  onNext={() => {
                    // Skip playlist item when navigating
                    let nextIndex = currentTrackIndex + 1;
                    while (nextIndex < musicRecs.length && musicRecs[nextIndex]?.isPlaylist) {
                      nextIndex++;
                    }
                    if (nextIndex < musicRecs.length) {
                      setCurrentTrackIndex(nextIndex);
                    }
                  }}
                  onPrevious={() => {
                    // Skip playlist item when navigating
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
            </CardContent>
          </Card>
        </div>

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
            {exerciseRecs.map((exercise: any) => (
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
