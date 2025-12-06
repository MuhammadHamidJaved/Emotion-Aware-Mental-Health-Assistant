'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Tag, Calendar, Clock, Type, Mic, Video, Zap } from 'lucide-react';

// Mock entry data (in real app, fetch from API using params.id)
const MOCK_ENTRIES = [
  {
    id: '1',
    type: 'text' as const,
    content: 'Had an amazing day at work today! The presentation went really well and my team was very supportive. Feeling proud of what we accomplished together. Looking forward to celebrating this success with them tomorrow.',
    date: '2025-01-08',
    time: '14:30',
    tags: ['work', 'achievement', 'team'],
    dominantEmotion: 'happy',
    confidence: 94,
    modelVersion: 'Text ML Model v2.1.0',
    processingTime: 234,
    allPredictions: [
      { emotion: 'happy', confidence: 94 },
      { emotion: 'confident', confidence: 87 },
      { emotion: 'grateful', confidence: 76 },
      { emotion: 'energetic', confidence: 62 },
      { emotion: 'loved', confidence: 45 },
      { emotion: 'calm', confidence: 38 },
      { emotion: 'neutral', confidence: 24 },
      { emotion: 'anxious', confidence: 12 },
    ]
  },
  {
    id: '2',
    type: 'voice' as const,
    content: 'Voice recording transcription: Just finished my morning meditation session. Feeling very peaceful and centered. The breathing exercises really helped clear my mind.',
    date: '2025-01-08',
    time: '08:15',
    tags: ['meditation', 'self-care'],
    dominantEmotion: 'calm',
    confidence: 91,
    modelVersion: 'Voice Analyzer v1.8.3',
    processingTime: 1456,
    allPredictions: [
      { emotion: 'calm', confidence: 91 },
      { emotion: 'happy', confidence: 68 },
      { emotion: 'grateful', confidence: 54 },
      { emotion: 'neutral', confidence: 42 },
      { emotion: 'confident', confidence: 29 },
    ]
  },
  {
    id: '3',
    type: 'video' as const,
    content: 'Video analysis: Discussing upcoming project deadline. Noticed some tension in facial expressions and voice tone. Concerns about meeting timeline.',
    date: '2025-01-07',
    time: '16:45',
    tags: ['work', 'deadline'],
    dominantEmotion: 'anxious',
    confidence: 88,
    modelVersion: 'Facial Recognition v3.0.1',
    processingTime: 3421,
    allPredictions: [
      { emotion: 'anxious', confidence: 88 },
      { emotion: 'neutral', confidence: 65 },
      { emotion: 'frustrated', confidence: 52 },
      { emotion: 'sad', confidence: 34 },
      { emotion: 'angry', confidence: 18 },
    ]
  },
  {
    id: '4',
    type: 'text' as const,
    content: 'Feeling a bit overwhelmed with everything going on. Too many tasks, not enough time. Need to prioritize better.',
    date: '2025-01-07',
    time: '11:20',
    tags: ['stress', 'productivity'],
    dominantEmotion: 'anxious',
    confidence: 92,
    modelVersion: 'Text ML Model v2.1.0',
    processingTime: 198,
    allPredictions: [
      { emotion: 'anxious', confidence: 92 },
      { emotion: 'frustrated', confidence: 79 },
      { emotion: 'sad', confidence: 45 },
      { emotion: 'neutral', confidence: 38 },
      { emotion: 'angry', confidence: 22 },
    ]
  },
  {
    id: '5',
    type: 'text' as const,
    content: 'Grateful for my family and friends. They\'ve been so supportive lately. Feeling blessed to have such wonderful people in my life.',
    date: '2025-01-06',
    time: '20:15',
    tags: ['gratitude', 'family', 'friends'],
    dominantEmotion: 'grateful',
    confidence: 96,
    modelVersion: 'Text ML Model v2.1.0',
    processingTime: 187,
    allPredictions: [
      { emotion: 'grateful', confidence: 96 },
      { emotion: 'happy', confidence: 88 },
      { emotion: 'loved', confidence: 82 },
      { emotion: 'calm', confidence: 54 },
      { emotion: 'confident', confidence: 41 },
      { emotion: 'neutral', confidence: 28 },
    ]
  },
];

const EMOTION_COLORS: Record<string, string> = {
  happy: 'text-yellow-500',
  sad: 'text-blue-500',
  angry: 'text-red-500',
  anxious: 'text-purple-500',
  calm: 'text-teal-500',
  excited: 'text-orange-500',
  neutral: 'text-gray-500',
  surprised: 'text-pink-500',
  disgusted: 'text-green-500',
  fearful: 'text-indigo-500',
  confident: 'text-amber-500',
  grateful: 'text-emerald-500',
  loved: 'text-rose-500',
  frustrated: 'text-orange-600',
  energetic: 'text-yellow-400',
  bored: 'text-gray-400',
};

const TYPE_ICONS = {
  text: Type,
  voice: Mic,
  video: Video,
};

function getEmoji(emotion: string): string {
  const emojiMap: Record<string, string> = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    anxious: '😰',
    calm: '😌',
    excited: '🤩',
    neutral: '😐',
    surprised: '😲',
    disgusted: '🤢',
    fearful: '😨',
    confident: '😎',
    grateful: '🙏',
    loved: '🥰',
    frustrated: '😤',
    energetic: '⚡',
    bored: '😑',
  };
  return emojiMap[emotion] || '😊';
}

export default function CheckInDetailPage() {
  const params = useParams();
  const entryId = params.id as string;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Find the entry
  const entry = MOCK_ENTRIES.find(e => e.id === entryId);

  if (!entry) {
    return (
      <div className="min-h-screen bg-white text-black p-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-2xl font-bold mb-4">Check-In Not Found</h1>
          <p className="text-gray-600 mb-6">The check-in you're looking for doesn't exist.</p>
          <Link 
            href="/check-in"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Check-In History
          </Link>
        </div>
      </div>
    );
  }

  const TypeIcon = TYPE_ICONS[entry.type];

  const handleDelete = () => {
    // In real app, call API to delete entry
    console.log('Deleting check-in:', entryId);
    // Redirect to check-in list
    window.location.href = '/check-in';
  };

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/check-in"
            className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back to Check-In History</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={`/check-in/${entryId}/edit`}
              className="flex items-center gap-2 px-4 py-2 border border-black rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span className="text-sm font-medium">Edit</span>
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium">Delete</span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Entry Header */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-lg">
                    <TypeIcon className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 capitalize">{entry.type} Check-In</div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(entry.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        {entry.time}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {entry.tags.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <div className="flex flex-wrap gap-2">
                    {entry.tags.map(tag => (
                      <span 
                        key={tag}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="prose max-w-none">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {entry.content}
                </p>
              </div>
            </div>

            {/* All Predictions */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">All Emotion Predictions</h3>
              <div className="space-y-3">
                {entry.allPredictions.map((pred, idx) => (
                  <div key={pred.emotion} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getEmoji(pred.emotion)}</span>
                        <span className={`font-medium capitalize ${EMOTION_COLORS[pred.emotion] || 'text-gray-700'}`}>
                          {pred.emotion}
                        </span>
                      </div>
                      <span className="text-gray-600 font-medium">{pred.confidence}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 0 ? 'bg-black' : 'bg-gray-400'
                        }`}
                        style={{ width: `${pred.confidence}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Dominant Emotion */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Dominant Emotion</h3>
              <div 
                className="p-6 rounded-lg mb-4"
                style={{ 
                  backgroundColor: `${EMOTION_COLORS[entry.dominantEmotion]?.replace('text-', '')}10` 
                }}
              >
                <div className="text-center">
                  <div className="text-6xl mb-3">{getEmoji(entry.dominantEmotion)}</div>
                  <div className={`text-2xl font-bold capitalize mb-2 ${EMOTION_COLORS[entry.dominantEmotion]}`}>
                    {entry.dominantEmotion}
                  </div>
                  <div className="text-sm text-gray-600">
                    {entry.confidence}% confidence
                  </div>
                </div>
              </div>

              {/* ML Details */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-t border-gray-200">
                  <span className="text-gray-600">Processing Time</span>
                  <span className="flex items-center gap-1 font-medium text-gray-900">
                    <Zap className="w-3.5 h-3.5" />
                    {entry.processingTime}ms
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-200">
                  <span className="text-gray-600">Model Version</span>
                  <span className="font-medium text-gray-900 text-xs">
                    {entry.modelVersion}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-200">
                  <span className="text-gray-600">Check-In Type</span>
                  <span className="font-medium text-gray-900 capitalize flex items-center gap-1.5">
                    <TypeIcon className="w-3.5 h-3.5" />
                    {entry.type}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Quick Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Word Count</span>
                  <span className="font-medium">{entry.content.split(' ').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Character Count</span>
                  <span className="font-medium">{entry.content.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tags</span>
                  <span className="font-medium">{entry.tags.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Detected Emotions</span>
                  <span className="font-medium">{entry.allPredictions.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-2">Delete Check-In?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this check-in? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

