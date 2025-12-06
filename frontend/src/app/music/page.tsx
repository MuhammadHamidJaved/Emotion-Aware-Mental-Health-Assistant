'use client';

import { useState } from 'react';
import { Play, Pause, SkipForward, Volume2, Heart, Music, Clock, TrendingUp } from 'lucide-react';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  emotion: string;
  genre: string;
  bpm: number;
  coverColor: string;
}

const MUSIC_LIBRARY: Record<string, Track[]> = {
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

export default function MusicPage() {
  const [selectedEmotion, setSelectedEmotion] = useState<string>('calm');
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  const emotions = [
    { key: 'calm', label: 'Calm & Relax', emoji: '😌', color: 'teal', description: 'Soothing music to reduce stress' },
    { key: 'happy', label: 'Happy & Upbeat', emoji: '😊', color: 'yellow', description: 'Uplifting tunes to boost mood' },
    { key: 'anxious', label: 'Anxiety Relief', emoji: '😰', color: 'purple', description: 'Calming sounds to ease anxiety' },
    { key: 'sad', label: 'Comfort & Support', emoji: '😢', color: 'blue', description: 'Gentle music for healing' },
    { key: 'energetic', label: 'Energy Boost', emoji: '⚡', color: 'orange', description: 'Motivating tracks to energize' },
  ];

  const currentTracks = MUSIC_LIBRARY[selectedEmotion] || [];

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
  };

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Music Therapy</h1>
              <p className="text-gray-600">Personalized playlists based on your emotions</p>
            </div>
          </div>
        </div>

        {/* Emotion Selector */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Choose Your Mood</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {emotions.map((emotion) => (
              <button
                key={emotion.key}
                onClick={() => setSelectedEmotion(emotion.key)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedEmotion === emotion.key
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">{emotion.emoji}</div>
                <div className="font-semibold mb-1">{emotion.label}</div>
                <div className="text-xs text-gray-600">{emotion.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Track List */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {emotions.find(e => e.key === selectedEmotion)?.label} Playlist
              </h2>
              <span className="text-sm text-gray-600">{currentTracks.length} tracks</span>
            </div>

            <div className="space-y-3">
              {currentTracks.map((track) => (
                <div
                  key={track.id}
                  className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all ${
                    currentTrack?.id === track.id ? 'bg-gray-50 border-black' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Album Art */}
                    <div className={`w-16 h-16 ${track.coverColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Music className="w-8 h-8 text-white" />
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{track.title}</h3>
                      <p className="text-sm text-gray-600 truncate">{track.artist}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">{track.genre}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{track.bpm} BPM</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{track.duration}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFavorite(track.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          favorites.includes(track.id)
                            ? 'text-red-500 hover:bg-red-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        <Heart
                          className={`w-5 h-5 ${favorites.includes(track.id) ? 'fill-current' : ''}`}
                        />
                      </button>
                      <button
                        onClick={() => handlePlayPause(track)}
                        className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        {currentTrack?.id === track.id && isPlaying ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Now Playing / Info Sidebar */}
          <div className="space-y-6">
            {/* Now Playing */}
            {currentTrack ? (
              <div className="border border-gray-200 rounded-lg p-6 sticky top-24">
                <h3 className="font-semibold mb-4">Now Playing</h3>
                <div className={`w-full h-48 ${currentTrack.coverColor} rounded-lg flex items-center justify-center mb-4`}>
                  <Music className="w-24 h-24 text-white" />
                </div>
                <h4 className="font-bold text-lg mb-1">{currentTrack.title}</h4>
                <p className="text-gray-600 mb-4">{currentTrack.artist}</p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div className="w-1/3 h-full bg-black rounded-full"></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1:23</span>
                    <span>{currentTrack.duration}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Volume2 className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-4 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6" />
                    )}
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <SkipForward className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-6 text-center">
                <Music className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Select a track to start listening</p>
              </div>
            )}

            {/* Music Benefits */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold mb-4">Music Therapy Benefits</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Reduces Stress</div>
                    <div className="text-gray-600 text-xs">Lowers cortisol levels by up to 65%</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Heart className="w-3 h-3 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">Improves Mood</div>
                    <div className="text-gray-600 text-xs">Releases dopamine and serotonin</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-3 h-3 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium">Better Sleep</div>
                    <div className="text-gray-600 text-xs">Calming music improves sleep quality</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Listening Stats */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold mb-4">Your Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Minutes Listened</span>
                  <span className="font-semibold">127</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Favorite Genre</span>
                  <span className="font-semibold">Ambient</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saved Tracks</span>
                  <span className="font-semibold">{favorites.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
