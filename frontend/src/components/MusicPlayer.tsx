'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Plus, MoreHorizontal, Music, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration?: string;
  preview_url?: string | null;
  url?: string;
  coverColor?: string;
  coverImage?: string;
}

interface MusicPlayerProps {
  track: Track;
  playlist?: Track[];
  onNext?: () => void;
  onPrevious?: () => void;
  onTrackSelect?: (track: Track) => void;
}

export default function MusicPlayer({ track, playlist = [], onNext, onPrevious, onTrackSelect }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [usePreview, setUsePreview] = useState(false); // Toggle between embed and preview
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Convert Spotify URL to embed URL
  const getEmbedUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    // Handle track URLs
    if (url.includes('open.spotify.com/track/')) {
      return url.replace('open.spotify.com/track/', 'open.spotify.com/embed/track/');
    }
    // Handle playlist URLs
    if (url.includes('open.spotify.com/playlist/')) {
      return url.replace('open.spotify.com/playlist/', 'open.spotify.com/embed/playlist/');
    }
    // Handle album URLs
    if (url.includes('open.spotify.com/album/')) {
      return url.replace('open.spotify.com/album/', 'open.spotify.com/embed/album/');
    }
    return null;
  };

  const embedUrl = getEmbedUrl(track.url);
  const hasEmbed = !!embedUrl;

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current && track.preview_url) {
      audioRef.current = new Audio(track.preview_url);
      audioRef.current.addEventListener('loadedmetadata', () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
        }
      });
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      });
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (onNext) {
          onNext();
        }
      });
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [track.preview_url, onNext]);

  // Update audio source when track changes
  useEffect(() => {
    if (audioRef.current && track.preview_url) {
      audioRef.current.src = track.preview_url;
      audioRef.current.load();
      setCurrentTime(0);
      setIsPlaying(false);
    }
    // Reset to embed mode when track changes (if embed is available)
    const newEmbedUrl = getEmbedUrl(track.url);
    if (newEmbedUrl) {
      setUsePreview(false);
    } else if (track.preview_url) {
      setUsePreview(true);
    }
  }, [track.id, track.preview_url, track.url]);

  const togglePlayPause = () => {
    // If using preview audio
    if (usePreview && track.preview_url) {
      if (!audioRef.current) {
        return;
      }
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((error) => {
          console.error('Error playing audio:', error);
        });
      }
      setIsPlaying(!isPlaying);
    } else if (hasEmbed) {
      // Spotify embed handles playback automatically
      // We can't control it programmatically, but we can track state
      setIsPlaying(!isPlaying);
    } else if (track.url) {
      // Fallback: open in Spotify
      window.open(track.url, '_blank');
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 1;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasPreview = !!track.preview_url;

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 text-white">
      {/* Playlist Card */}
      <div className="flex gap-4 mb-4">
        {/* Cover Art */}
        <div className="flex-shrink-0">
          {track.coverImage ? (
            <img 
              src={track.coverImage} 
              alt={track.title}
              className="w-24 h-24 rounded object-cover"
            />
          ) : (
            <div className={`w-24 h-24 ${track.coverColor || 'bg-gradient-to-br from-purple-500 to-blue-500'} rounded flex items-center justify-center relative`}>
              <Music className="w-8 h-8 text-white opacity-80" />
              <div className="absolute top-1 right-1 bg-[#1DB954] rounded-full p-1">
                <Music className="w-3 h-3 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <h3 className="font-semibold text-lg truncate">{track.title}</h3>
            <p className="text-sm text-gray-400 truncate">{track.artist}</p>
          </div>
          {/* Toggle between embed and preview if both available */}
          {hasEmbed && hasPreview && (
            <div className="flex gap-2 mb-2">
              <Button
                size="sm"
                variant={!usePreview ? "default" : "outline"}
                className={`text-xs px-2 py-1 h-6 ${!usePreview ? 'bg-[#1DB954] hover:bg-[#1ed760] text-white' : 'text-gray-400'}`}
                onClick={() => setUsePreview(false)}
              >
                Full Track
              </Button>
              <Button
                size="sm"
                variant={usePreview ? "default" : "outline"}
                className={`text-xs px-2 py-1 h-6 ${usePreview ? 'bg-[#1DB954] hover:bg-[#1ed760] text-white' : 'text-gray-400'}`}
                onClick={() => setUsePreview(true)}
              >
                Preview
              </Button>
            </div>
          )}
          {track.url && !hasEmbed && (
            <a 
              href={track.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block"
            >
              <Button 
                size="sm" 
                className="bg-[#1DB954] hover:bg-[#1ed760] text-white text-xs px-3 py-1 h-7"
              >
                Open in Spotify
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Spotify Embed Player */}
      {hasEmbed && !usePreview && (
        <div className="mb-4">
          <iframe
            ref={iframeRef}
            src={embedUrl || ''}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-lg"
          />
        </div>
      )}

      {/* Preview Audio Player */}
      {hasPreview && usePreview && (
        <div className="mb-4">
          <audio
            ref={audioRef}
            src={track.preview_url || undefined}
            controls
            className="w-full h-10"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
          />
        </div>
      )}

      {/* Song List (if playlist) */}
      {playlist.length > 0 && (
        <div className="mb-4 max-h-48 overflow-y-auto">
          <div className="text-xs text-gray-400 mb-2 px-2">Track List:</div>
          {playlist.map((t, idx) => (
            <div
              key={t.id}
              className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-800 ${
                t.id === track.id ? 'bg-[#1DB954] bg-opacity-20' : ''
              }`}
              onClick={() => {
                if (t.id !== track.id && onTrackSelect) {
                  onTrackSelect(t);
                }
              }}
            >
              <span className="text-xs text-gray-400 w-4">{idx + 1}</span>
              {t.id === track.id && isPlaying && (
                <Play className="w-3 h-3 text-[#1DB954]" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate font-medium">{t.title}</div>
                <div className="text-xs text-gray-500 truncate">{t.artist}</div>
              </div>
              {t.url && (
                <a 
                  href={t.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[#1DB954] hover:text-[#1ed760] flex-shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Progress Bar - Only for preview audio */}
      {hasPreview && usePreview && (
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#1DB954]"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}

      {/* Controls - Only show for preview mode or if no embed */}
      {(usePreview || !hasEmbed) && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {playlist.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPrevious}
                className="text-white hover:bg-gray-800 p-2"
                disabled={!onPrevious}
              >
                <SkipBack className="w-4 h-4" />
              </Button>
            )}
            {usePreview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlayPause}
                className="text-white hover:bg-gray-800 p-2"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>
            )}
            {playlist.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onNext}
                className="text-white hover:bg-gray-800 p-2"
                disabled={!onNext}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {usePreview && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:bg-gray-800 p-2"
                >
                  <Volume2 className={`w-4 h-4 ${isMuted ? 'opacity-50' : ''}`} />
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#1DB954]"
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

