'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Play, Pause, SkipForward, Volume2, Heart, Music, Clock, TrendingUp, Loader2, ExternalLink } from 'lucide-react';
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

function normalizeSpotifyLink(url?: string | null): string | undefined {
  if (!url) return undefined;

  if (url.includes('open.spotify.com/')) {
    return url;
  }

  const uriMatch = url.match(/^spotify:(track|album|playlist):([A-Za-z0-9]+)$/);
  if (uriMatch) {
    return `https://open.spotify.com/${uriMatch[1]}/${uriMatch[2]}`;
  }

  const apiMatch = url.match(/api\.spotify\.com\/v1\/(tracks|albums|playlists)\/([A-Za-z0-9]+)/);
  if (apiMatch) {
    const typeMap: Record<string, string> = {
      tracks: 'track',
      albums: 'album',
      playlists: 'playlist',
    };
    return `https://open.spotify.com/${typeMap[apiMatch[1]]}/${apiMatch[2]}`;
  }

  return undefined;
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
    url: normalizeSpotifyLink(t.url),
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

  const normalizeToTabEmotion = (emotion: string | null): string => {
    const source = (emotion || '').toLowerCase().trim();
    if (!source) return 'calm';
    if ((VALID_TAB_EMOTIONS as readonly string[]).includes(source)) return source;
    return EMOTION_TAB_MAP[source] || 'calm';
  };

  // urlEmotion is the raw emotion from URL (may be outside tab list)
  const urlEmotionRaw = searchParams?.get('emotion') || null;

  const [selectedEmotion, setSelectedEmotion] = useState<string>(normalizeToTabEmotion(urlEmotionRaw));
  const [predictedEmotionLabel, setPredictedEmotionLabel] = useState<string>((urlEmotionRaw || '').trim());
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [apiTracks, setApiTracks] = useState<Track[]>([]);
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);
  const [recommendationId, setRecommendationId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userPrefs, setUserPrefs] = useState<Partial<RecommendationSettings>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load saved user preferences on mount so they are forwarded explicitly to
  // the microservice (ensures favorite_artists + music_language are both used).
  useEffect(() => {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!accessToken) return;
    apiGetRecommendationSettings(accessToken)
      .then(prefs => setUserPrefs(prefs))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Always lock this page to AI-provided emotion context.
    const fromUrl = (searchParams?.get('emotion') || '').trim();
    if (fromUrl) {
      setPredictedEmotionLabel(fromUrl);
      setSelectedEmotion(normalizeToTabEmotion(fromUrl));
      return;
    }

    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('lastRecommendations');
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      const detected = (parsed?.emotion || '').trim();
      if (detected) {
        setPredictedEmotionLabel(detected);
        setSelectedEmotion(normalizeToTabEmotion(detected));
      }
    } catch {
      // Ignore malformed local cache.
    }
  }, [searchParams]);

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
        setPlaylistUrl(normalizeSpotifyLink(musicData.playlist_url) || null);
        setRecommendationId(data.recommendation_id || '');
      } else {
        // No tracks from API — use fallback
        setUsingFallback(true);
        setApiTracks([]);
        setPlaylistUrl(null);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch personalized music:', err);
      const message = err instanceof Error ? err.message : 'Could not load personalized music';
      setError(message);
      setUsingFallback(true);
      setApiTracks([]);
      setPlaylistUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [userPrefs, urlEmotionRaw]);

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
    const stopCurrentAudio = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setCurrentTime(0);
    };

    if (currentTrack?.id === track.id) {
      if (!audioRef.current || !track.preview_url) {
        if (track.url) window.open(track.url, '_blank', 'noopener,noreferrer');
        return;
      }

      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {
          setIsPlaying(false);
        });
      }
      return;
    } else {
      stopCurrentAudio();
      setCurrentTrack(track);

      if (track.preview_url) {
        const audio = new Audio(track.preview_url);
        audioRef.current = audio;

        audio.addEventListener('loadedmetadata', () => {
          setTrackDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
        });
        audio.addEventListener('timeupdate', () => {
          setCurrentTime(audio.currentTime || 0);
        });
        audio.addEventListener('ended', () => {
          setIsPlaying(false);
          setCurrentTime(0);
        });

        audio.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(false);
        });
        return;
      }

      // No preview available, open Spotify directly.
      if (track.url) {
        window.open(track.url, '_blank', 'noopener,noreferrer');
      }
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-50 text-black -mx-4 sm:-mx-6">
      <div className="border-b border-neutral-200 bg-white px-4 sm:px-6 py-3.5">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-sm">
              <Music className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight text-neutral-900">Music Therapy</h1>
              <p className="mt-0.5 truncate text-xs text-neutral-500">
                {usingFallback ? 'Default library · personalize in Settings' : 'Mood-matched tracks'}
              </p>
            </div>
          </div>
          {playlistUrl && (
            <a
              href={playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-100 sm:self-auto"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Spotify playlist
            </a>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-5">
        {/* Banners */}
        {usingFallback && !isLoading && (
          <div className="mb-3 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-900 leading-snug sm:text-sm">
            <span className="mr-1">⚠️</span>
            Default playlist.{' '}
            <a href="/settings" className="font-medium underline underline-offset-2">
              Set preferences
            </a>{' '}
            for personalized music.
          </div>
        )}
        {predictedEmotionLabel && !usingFallback && !isLoading && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-indigo-200/80 bg-indigo-50/90 px-3 py-2 text-xs text-indigo-900 sm:text-sm">
            <span>✨</span>
            <span>
              For <strong className="capitalize">{predictedEmotionLabel}</strong> from your check-in.
            </span>
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-neutral-500 sm:text-xs">Mood</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-900 bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
            <span>{activeEmotion?.emoji}</span>
            {activeEmotion?.label}
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,280px)] lg:gap-5">

          <div className="order-1 overflow-hidden rounded-xl border border-neutral-200 bg-white lg:order-none">
            <div className="flex items-center justify-between gap-2 border-b border-neutral-100 px-3 py-3 sm:px-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accent.bg}`}>
                  <Music className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-neutral-900">{activeEmotion?.label} playlist</h2>
                  <p className="truncate text-[11px] text-neutral-500 sm:text-xs">{currentTracks.length} tracks</p>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                <Loader2 className="mb-2 h-6 w-6 animate-spin text-neutral-300" />
                <p className="text-xs text-neutral-500 sm:text-sm">Loading tracks…</p>
              </div>
            ) : currentTracks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
                <Music className="mb-2 h-9 w-9 text-neutral-200" />
                <p className="text-sm">No tracks for this mood.</p>
                <button
                  type="button"
                  onClick={() => fetchPersonalizedMusic(selectedEmotion)}
                  className="mt-2 text-xs font-medium text-neutral-900 underline underline-offset-2"
                >
                  Try again
                </button>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 bg-neutral-50/40">
                {currentTracks.map((track, idx) => {
                  const isActive = currentTrack?.id === track.id;
                  return (
                    <div key={track.id}
                      className={`group flex cursor-pointer items-center gap-2 px-3 py-2.5 transition-colors hover:bg-white sm:gap-3 sm:px-4 sm:py-3 ${isActive ? 'bg-white shadow-[inset_2px_0_0_0_#111827]' : ''}`}
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
                        <span className="text-xs text-gray-400 w-9 text-right">{track.duration || '0:00'}</span>
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

          <div className="order-2 space-y-3 lg:order-none lg:self-start">
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
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
                    {/* Live progress bar (preview playback only) */}
                    <div className="mt-3 mb-3">
                      <div className="w-full bg-gray-100 rounded-full h-1">
                        <div
                          className="h-full bg-black rounded-full transition-all"
                          style={{ width: `${trackDuration > 0 ? Math.min(100, (currentTime / trackDuration) * 100) : 0}%` }}
                        />
                      </div>
                      {isPlaying && currentTrack.preview_url && (
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>{formatDuration(Math.floor(currentTime * 1000))}</span>
                          <span>{formatDuration(Math.floor((trackDuration || 0) * 1000), currentTrack.duration)}</span>
                        </div>
                      )}
                    </div>
                    {/* Controls */}
                    <div className="flex items-center justify-between">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Volume2 className="w-4 h-4 text-gray-400" />
                      </button>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handlePlayPause(currentTrack)}
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
            <div className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-4">
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Session</h3>
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
            <div className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-4">
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Benefits</h3>
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
