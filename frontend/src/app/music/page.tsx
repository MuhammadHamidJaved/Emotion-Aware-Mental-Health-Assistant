'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Play, Pause, SkipForward, Volume2, Heart, Music, Clock, TrendingUp, RefreshCw, Loader2, ExternalLink, Settings } from 'lucide-react';
import { apiGetPersonalizedRecommendations, apiSendRecommendationFeedback, apiGetRecommendationSettings, type SpotifyTrack, type RecommendationSettings } from '@/lib/api';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  emotion: string;
  genre: string;
  bpm: number;
  coverColor: string;
  url?: string;
  preview_url?: string | null;
  coverImage?: string | null;
}

// Fallback tracks when microservice is unavailable
const FALLBACK_TRACKS: Record<string, Track[]> = {
  happy: [
    { id: '1', title: 'Walking on Sunshine', artist: 'Katrina and the Waves', duration: '3:58', emotion: 'happy', genre: 'Pop', bpm: 120, coverColor: 'bg-yellow-500' },
    { id: '2', title: 'Good Vibrations', artist: 'The Beach Boys', duration: '3:36', emotion: 'happy', genre: 'Rock', bpm: 128, coverColor: 'bg-yellow-400' },
    { id: '3', title: 'Happy', artist: 'Pharrell Williams', duration: '3:53', emotion: 'happy', genre: 'Pop', bpm: 160, coverColor: 'bg-amber-500' },
    { id: '4', title: 'Don\'t Stop Me Now', artist: 'Queen', duration: '3:29', emotion: 'happy', genre: 'Rock', bpm: 156, coverColor: 'bg-yellow-600' },
  ],
  calm: [
    { id: '5', title: 'Weightless', artist: 'Marconi Union', duration: '8:09', emotion: 'calm', genre: 'Ambient', bpm: 60, coverColor: 'bg-teal-500' },
    { id: '6', title: 'Clair de Lune', artist: 'Debussy', duration: '5:24', emotion: 'calm', genre: 'Classical', bpm: 70, coverColor: 'bg-teal-400' },
    { id: '7', title: 'Spiegel im Spiegel', artist: 'Arvo Pärt', duration: '9:15', emotion: 'calm', genre: 'Classical', bpm: 54, coverColor: 'bg-cyan-500' },
    { id: '8', title: 'Watermark', artist: 'Enya', duration: '2:26', emotion: 'calm', genre: 'New Age', bpm: 65, coverColor: 'bg-teal-600' },
  ],
  anxious: [
    { id: '9', title: 'Ocean Waves', artist: 'Nature Sounds', duration: '10:00', emotion: 'anxious', genre: 'Ambient', bpm: 60, coverColor: 'bg-purple-500' },
    { id: '10', title: 'Deep Breathing', artist: 'Meditation Collective', duration: '5:30', emotion: 'anxious', genre: 'Meditation', bpm: 58, coverColor: 'bg-purple-400' },
    { id: '11', title: 'Calm Piano', artist: 'Relaxing Music', duration: '7:45', emotion: 'anxious', genre: 'Instrumental', bpm: 62, coverColor: 'bg-indigo-500' },
  ],
  sad: [
    { id: '12', title: 'Fix You', artist: 'Coldplay', duration: '4:54', emotion: 'sad', genre: 'Alternative', bpm: 138, coverColor: 'bg-blue-500' },
    { id: '13', title: 'The Scientist', artist: 'Coldplay', duration: '5:09', emotion: 'sad', genre: 'Alternative', bpm: 146, coverColor: 'bg-blue-400' },
    { id: '14', title: 'Someone Like You', artist: 'Adele', duration: '4:45', emotion: 'sad', genre: 'Pop', bpm: 67, coverColor: 'bg-blue-600' },
  ],
  energetic: [
    { id: '15', title: 'Eye of the Tiger', artist: 'Survivor', duration: '4:05', emotion: 'energetic', genre: 'Rock', bpm: 109, coverColor: 'bg-orange-500' },
    { id: '16', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', duration: '4:30', emotion: 'energetic', genre: 'Funk', bpm: 115, coverColor: 'bg-orange-400' },
    { id: '17', title: 'Can\'t Stop the Feeling', artist: 'Justin Timberlake', duration: '3:56', emotion: 'energetic', genre: 'Pop', bpm: 113, coverColor: 'bg-red-500' },
  ],
};

const EMOTION_COVER_COLORS: Record<string, string> = {
  happy: 'bg-yellow-500', calm: 'bg-teal-500', anxious: 'bg-purple-500',
  sad: 'bg-blue-500', energetic: 'bg-orange-500',
};

function formatDuration(ms?: number, raw?: string): string {
  if (ms) return `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;
  return raw || '0:00';
}

function spotifyToTrack(t: SpotifyTrack, idx: number, emotion: string): Track {
  // Handle album as either string or object (API returns flat string)
  const albumImage = typeof t.album === 'object' && t.album?.images?.[0]?.url
    ? t.album.images[0].url
    : null;
  const coverImage = t.image_url || albumImage || t.images?.[0]?.url || null;

  return {
    id: t.id || `api-${idx}`,
    title: t.title || 'Unknown Track',
    artist: t.artist || t.artists?.[0]?.name || 'Unknown Artist',
    duration: formatDuration(t.duration_ms, t.duration),
    emotion,
    genre: '',
    bpm: t.bpm || 0,
    coverColor: EMOTION_COVER_COLORS[emotion] || 'bg-purple-500',
    url: t.url || undefined,
    preview_url: t.preview_url,
    coverImage,
  };
}

export default function MusicPage() {
  const searchParams = useSearchParams();

  // Valid tab keys on this page
  const VALID_TAB_EMOTIONS = ['calm', 'happy', 'anxious', 'sad', 'energetic'] as const;
  // Map incoming emotions to the closest music tab
  const EMOTION_TAB_MAP: Record<string, string> = {
    neutral: 'calm', tired: 'calm', relaxed: 'calm', peaceful: 'calm', content: 'calm',
    frustrated: 'sad', lonely: 'sad', melancholic: 'sad', heartbroken: 'sad', depressed: 'sad',
    excited: 'happy', grateful: 'happy', hopeful: 'happy', love: 'happy',
    fear: 'anxious', stressed: 'anxious', confused: 'anxious', overwhelmed: 'anxious',
    motivated: 'energetic', bored: 'energetic', angry: 'energetic', energetic: 'energetic',
  };

  const getInitialEmotion = () => {
    const urlEmotion = searchParams?.get('emotion') || '';
    if (!urlEmotion) return 'calm';
    if ((VALID_TAB_EMOTIONS as readonly string[]).includes(urlEmotion)) return urlEmotion;
    return EMOTION_TAB_MAP[urlEmotion] || 'calm';
  };

  // urlEmotion is the raw emotion from URL (may be outside tab list)
  const urlEmotionRaw = searchParams?.get('emotion') || null;

  const [selectedEmotion, setSelectedEmotion] = useState<string>(getInitialEmotion());
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [apiTracks, setApiTracks] = useState<Track[]>([]);
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);
  const [recommendationId, setRecommendationId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userPrefs, setUserPrefs] = useState<Partial<RecommendationSettings>>({});

  // Load saved user preferences on mount so they are forwarded explicitly to
  // the microservice (ensures favorite_artists + music_language are both used).
  useEffect(() => {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!accessToken) return;
    apiGetRecommendationSettings(accessToken)
      .then(prefs => setUserPrefs(prefs))
      .catch(() => {});
  }, []);

  const emotions = [
    { key: 'calm', label: 'Calm & Relax', emoji: '😌', color: 'teal', description: 'Soothing music to reduce stress' },
    { key: 'happy', label: 'Happy & Upbeat', emoji: '😊', color: 'yellow', description: 'Uplifting tunes to boost mood' },
    { key: 'anxious', label: 'Anxiety Relief', emoji: '😰', color: 'purple', description: 'Calming sounds to ease anxiety' },
    { key: 'sad', label: 'Comfort & Support', emoji: '😢', color: 'blue', description: 'Gentle music for healing' },
    { key: 'energetic', label: 'Energy Boost', emoji: '⚡', color: 'orange', description: 'Motivating tracks to energize' },
  ];

  const fetchPersonalizedMusic = useCallback(async (emotion: string) => {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!accessToken) {
      setUsingFallback(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setUsingFallback(false);

    try {
      const data = await apiGetPersonalizedRecommendations(accessToken, {
        // Use the raw URL emotion if available (richer personalization), else the tab emotion
        emotion: urlEmotionRaw || emotion,
        types: ['music'],
        // Explicitly forward saved preferences so the microservice uses
        // BOTH music_language AND favorite_artists.
        preferences: {
          music_language: userPrefs.music_language,
          music_genres: userPrefs.music_genres,
          favorite_artists: userPrefs.favorite_artists,
          market: userPrefs.market,
        },
      });

      const musicData = data.recommendations?.music;
      if (musicData?.tracks && musicData.tracks.length > 0) {
        const tracks = musicData.tracks.map((t, idx) => spotifyToTrack(t, idx, emotion));
        setApiTracks(tracks);
        setPlaylistUrl(musicData.playlist_url || null);
        setRecommendationId(data.recommendation_id || '');
      } else {
        // No tracks from API — use fallback
        setUsingFallback(true);
        setApiTracks([]);
        setPlaylistUrl(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch personalized music:', err);
      setError(err.message || 'Could not load personalized music');
      setUsingFallback(true);
      setApiTracks([]);
      setPlaylistUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [userPrefs]);

  // Fetch when emotion changes
  useEffect(() => {
    setCurrentTrack(null);
    setIsPlaying(false);
    fetchPersonalizedMusic(selectedEmotion);
  }, [selectedEmotion, fetchPersonalizedMusic]);

  const currentTracks = usingFallback
    ? (FALLBACK_TRACKS[selectedEmotion] || [])
    : apiTracks;

  const handlePlayPause = (track: Track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const toggleFavorite = (trackId: string) => {
    setFavorites(prev =>
      prev.includes(trackId)
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );

    // Send feedback to microservice
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (accessToken && !usingFallback) {
      apiSendRecommendationFeedback(accessToken, {
        recommendation_id: recommendationId,
        item_id: trackId,
        feedback_type: favorites.includes(trackId) ? 'dislike' : 'like',
        recommendation_type: 'music',
      }).catch(() => {});
    }
  };

  const activeEmotion = emotions.find(e => e.key === selectedEmotion);

  const MOOD_ACCENT: Record<string, { bg: string; text: string; light: string }> = {
    calm:     { bg: 'bg-teal-500',   text: 'text-teal-600',   light: 'bg-teal-50 border-teal-200' },
    happy:    { bg: 'bg-yellow-400', text: 'text-yellow-600', light: 'bg-yellow-50 border-yellow-200' },
    anxious:  { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50 border-purple-200' },
    sad:      { bg: 'bg-blue-500',   text: 'text-blue-600',   light: 'bg-blue-50 border-blue-200' },
    energetic:{ bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50 border-orange-200' },
  };
  const accent = MOOD_ACCENT[selectedEmotion] || MOOD_ACCENT.calm;

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Music className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none">Music Therapy</h1>
              <p className="text-xs text-gray-500 mt-0.5">{usingFallback ? 'Default library' : 'Personalized for you'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {playlistUrl && (
              <a href={playlistUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors border border-green-200">
                <ExternalLink className="w-3 h-3" /> Open Playlist
              </a>
            )}
            <a href="/settings" className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Personalization settings">
              <Settings className="w-4 h-4 text-gray-500" />
            </a>
            <button onClick={() => fetchPersonalizedMusic(selectedEmotion)} disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-xs font-medium disabled:opacity-50">
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Banners */}
        {usingFallback && !isLoading && (
          <div className="mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center gap-2">
            <span>⚠️</span>
            <span>Using default playlist. <a href="/settings" className="underline font-medium">Set your preferences</a> for personalized music.</span>
          </div>
        )}
        {urlEmotionRaw && !usingFallback && !isLoading && (
          <div className="mb-4 px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-700 flex items-center gap-2">
            <span>✨</span>
            <span>Personalized for your <strong className="capitalize">{urlEmotionRaw}</strong> emotion from your last check-in.</span>
            <a href="/music" className="ml-auto text-xs text-indigo-400 hover:underline">Clear</a>
          </div>
        )}

        {/* Mood indicator */}
        {urlEmotionRaw ? (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs font-medium text-gray-500">Detected mood:</span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-black text-white border border-black shadow-sm">
              <span>{activeEmotion?.emoji}</span>{activeEmotion?.label}
            </span>
            <span className="text-xs text-gray-400">— from your last check-in</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap mb-6">
            <span className="text-xs font-medium text-gray-500 mr-1">Choose mood:</span>
            {emotions.map((emo) => (
              <button key={emo.key} onClick={() => setSelectedEmotion(emo.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  selectedEmotion === emo.key
                    ? 'bg-black text-white border-black shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}>
                <span>{emo.emoji}</span>{emo.label}
              </button>
            ))}
          </div>
        )}

        {/* Main layout */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">

          {/* Track list */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Playlist header */}
            <div className={`px-5 py-4 border-b border-gray-100 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${accent.bg} rounded-lg flex items-center justify-center`}>
                  <Music className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">{activeEmotion?.label} Playlist</h2>
                  <p className="text-xs text-gray-500">
                    {currentTracks.length} tracks
                    {userPrefs.favorite_artists && userPrefs.favorite_artists.length > 0 && (
                      <span className="ml-2 text-purple-600 font-medium">
                        · featuring {userPrefs.favorite_artists.join(', ')}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-7 h-7 animate-spin text-gray-300 mb-3" />
                <p className="text-sm text-gray-400">Loading personalized tracks…</p>
              </div>
            ) : currentTracks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Music className="w-10 h-10 mb-3 text-gray-200" />
                <p className="text-sm">No tracks for this mood.</p>
                <button onClick={() => fetchPersonalizedMusic(selectedEmotion)}
                  className="mt-3 text-xs text-black underline">Try again</button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {currentTracks.map((track, idx) => {
                  const isActive = currentTrack?.id === track.id;
                  return (
                    <div key={track.id}
                      className={`flex items-center gap-3 px-5 py-3 group hover:bg-gray-50 transition-colors cursor-pointer ${isActive ? 'bg-gray-50' : ''}`}
                      onClick={() => handlePlayPause(track)}>
                      {/* Track number / play indicator */}
                      <div className="w-6 text-center flex-shrink-0">
                        {isActive && isPlaying
                          ? <div className="flex items-end justify-center gap-0.5 h-4">
                              <span className="w-1 bg-black rounded-full animate-bounce" style={{height:'60%', animationDelay:'0ms'}} />
                              <span className="w-1 bg-black rounded-full animate-bounce" style={{height:'100%', animationDelay:'150ms'}} />
                              <span className="w-1 bg-black rounded-full animate-bounce" style={{height:'40%', animationDelay:'300ms'}} />
                            </div>
                          : <span className={`text-xs ${isActive ? 'text-black font-bold' : 'text-gray-400 group-hover:hidden'}`}>{idx + 1}</span>
                        }
                        {!isActive && <Play className="w-3.5 h-3.5 text-gray-600 hidden group-hover:block" />}
                      </div>

                      {/* Album art */}
                      {track.coverImage
                        ? <img src={track.coverImage} alt={track.title} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                        : <div className={`w-10 h-10 ${track.coverColor} rounded-md flex items-center justify-center flex-shrink-0`}>
                            <Music className="w-4 h-4 text-white" />
                          </div>
                      }

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-black' : 'text-gray-800'}`}>{track.title}</p>
                        <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                      </div>

                      {/* Duration + actions */}
                      <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <span className="text-xs text-gray-400 w-9 text-right">{track.duration}</span>
                        <button onClick={() => toggleFavorite(track.id)}
                          className={`p-1.5 rounded-lg transition-colors ${favorites.includes(track.id) ? 'text-red-500' : 'text-gray-300 hover:text-gray-500'}`}>
                          <Heart className={`w-4 h-4 ${favorites.includes(track.id) ? 'fill-current' : ''}`} />
                        </button>
                        {track.url && (
                          <a href={track.url} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 text-gray-300 hover:text-green-600 rounded-lg transition-colors">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Now Playing card */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden sticky top-20">
              {currentTrack ? (
                <>
                  {/* Art */}
                  {currentTrack.coverImage
                    ? <img src={currentTrack.coverImage} alt={currentTrack.title} className="w-full aspect-square object-cover" />
                    : <div className={`w-full aspect-square ${currentTrack.coverColor} flex items-center justify-center`}>
                        <Music className="w-16 h-16 text-white/60" />
                      </div>
                  }
                  <div className="p-4">
                    <p className="font-bold text-sm truncate">{currentTrack.title}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{currentTrack.artist}</p>
                    {/* Fake progress bar */}
                    <div className="mt-3 mb-3">
                      <div className="w-full bg-gray-100 rounded-full h-1">
                        <div className="w-1/3 h-full bg-black rounded-full" />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>1:23</span><span>{currentTrack.duration}</span>
                      </div>
                    </div>
                    {/* Controls */}
                    <div className="flex items-center justify-between">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Volume2 className="w-4 h-4 text-gray-400" />
                      </button>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setIsPlaying(!isPlaying)}
                          className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors">
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>
                      </div>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <SkipForward className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    {currentTrack.url && (
                      <a href={currentTrack.url} target="_blank" rel="noopener noreferrer"
                        className="mt-3 flex items-center justify-center gap-2 w-full py-2 bg-[#1DB954] text-white rounded-lg text-xs font-semibold hover:bg-[#1aa34a] transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" /> Listen on Spotify
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Music className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Nothing playing</p>
                  <p className="text-xs text-gray-400 mt-1">Pick a track to start</p>
                </div>
              )}
            </div>

            {/* Stats card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Session</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Saved', value: favorites.length },
                  { label: 'Total tracks', value: currentTracks.length },
                  { label: 'Source', value: usingFallback ? 'Default' : 'Personalized' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{item.label}</span>
                    <span className="text-xs font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Benefits</h3>
              <div className="space-y-2.5">
                {[
                  { icon: <TrendingUp className="w-3 h-3 text-green-600" />, bg: 'bg-green-100', label: 'Reduces Stress', sub: 'Lowers cortisol by 65%' },
                  { icon: <Heart className="w-3 h-3 text-blue-600" />,     bg: 'bg-blue-100',  label: 'Boosts Mood',    sub: 'Releases dopamine' },
                  { icon: <Clock className="w-3 h-3 text-purple-600" />,   bg: 'bg-purple-100',label: 'Better Sleep',   sub: 'Improves sleep quality' },
                ].map(b => (
                  <div key={b.label} className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 ${b.bg} rounded-md flex items-center justify-center flex-shrink-0`}>{b.icon}</div>
                    <div>
                      <p className="text-xs font-medium">{b.label}</p>
                      <p className="text-xs text-gray-400">{b.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
