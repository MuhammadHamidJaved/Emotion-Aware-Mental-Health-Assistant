'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Save, X, Loader2, Zap, RefreshCcw, Tag, Type, Mic, Video } from 'lucide-react';

// Mock entry data (same as detail page)
const MOCK_ENTRIES = [
  {
    id: '1',
    type: 'text' as const,
    content: 'Had an amazing day at work today! The presentation went really well and my team was very supportive. Feeling proud of what we accomplished together. Looking forward to celebrating this success with them tomorrow.',
    tags: ['work', 'achievement', 'team'],
    dominantEmotion: 'happy',
    confidence: 94,
    allPredictions: [
      { emotion: 'happy', confidence: 94 },
      { emotion: 'confident', confidence: 87 },
      { emotion: 'grateful', confidence: 76 },
      { emotion: 'energetic', confidence: 62 },
      { emotion: 'loved', confidence: 45 },
    ]
  },
  {
    id: '2',
    type: 'voice' as const,
    content: 'Voice recording transcription: Just finished my morning meditation session. Feeling very peaceful and centered. The breathing exercises really helped clear my mind.',
    tags: ['meditation', 'self-care'],
    dominantEmotion: 'calm',
    confidence: 91,
    allPredictions: [
      { emotion: 'calm', confidence: 91 },
      { emotion: 'happy', confidence: 68 },
      { emotion: 'grateful', confidence: 54 },
    ]
  },
];

const EMOTION_COLORS: Record<string, string> = {
  happy: 'bg-yellow-500',
  sad: 'bg-blue-500',
  angry: 'bg-red-500',
  anxious: 'bg-purple-500',
  calm: 'bg-teal-500',
  excited: 'bg-orange-500',
  neutral: 'bg-gray-500',
  surprised: 'bg-pink-500',
  disgusted: 'bg-green-500',
  fearful: 'bg-indigo-500',
  confident: 'bg-amber-500',
  grateful: 'bg-emerald-500',
  loved: 'bg-rose-500',
  frustrated: 'bg-orange-600',
  energetic: 'bg-yellow-400',
  bored: 'bg-gray-400',
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

export default function EditCheckInPage() {
  const params = useParams();
  const entryId = params.id as string;
  
  const entry = MOCK_ENTRIES.find(e => e.id === entryId);

  const [content, setContent] = useState(entry?.content || '');
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  
  // Original emotion data
  const [originalEmotion, setOriginalEmotion] = useState({
    dominant: entry?.dominantEmotion || '',
    confidence: entry?.confidence || 0,
    predictions: entry?.allPredictions || []
  });

  // New emotion data (after re-detection)
  const [newEmotion, setNewEmotion] = useState<{
    dominant: string;
    confidence: number;
    predictions: { emotion: string; confidence: number }[];
  } | null>(null);

  if (!entry) {
    return (
      <div className="min-h-screen bg-white text-black p-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-2xl font-bold mb-4">Check-In Not Found</h1>
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

  const detectEmotion = async (text: string) => {
    if (text.trim().length < 10) return;

    setIsReanalyzing(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Simple keyword-based mock detection
    const emotions = [
      { keywords: ['great', 'awesome', 'wonderful', 'excellent', 'good', 'love', 'amazing'], emotion: 'happy' },
      { keywords: ['sad', 'down', 'unhappy', 'depressed', 'tears', 'cry'], emotion: 'sad' },
      { keywords: ['worried', 'anxious', 'nervous', 'stress', 'concerned'], emotion: 'anxious' },
      { keywords: ['peaceful', 'calm', 'relaxed', 'meditation', 'serene'], emotion: 'calm' },
      { keywords: ['excited', 'cant wait', 'looking forward', 'thrilled'], emotion: 'excited' },
      { keywords: ['thankful', 'grateful', 'appreciate', 'blessed'], emotion: 'grateful' },
      { keywords: ['frustrated', 'annoyed', 'stuck', 'difficult'], emotion: 'frustrated' },
      { keywords: ['angry', 'mad', 'furious', 'hate'], emotion: 'angry' },
    ];

    const lowerText = text.toLowerCase();
    let detectedEmotion = 'neutral';
    let maxMatches = 0;

    emotions.forEach(({ keywords, emotion }) => {
      const matches = keywords.filter(kw => lowerText.includes(kw)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedEmotion = emotion;
      }
    });

    const confidence = 85 + Math.floor(Math.random() * 10);
    
    // Generate top 5 predictions
    const predictions = [
      { emotion: detectedEmotion, confidence: confidence },
      { emotion: 'neutral', confidence: confidence - 15 },
      { emotion: 'calm', confidence: confidence - 25 },
      { emotion: 'happy', confidence: confidence - 32 },
      { emotion: 'confident', confidence: confidence - 45 },
    ].sort((a, b) => b.confidence - a.confidence).slice(0, 5);

    setNewEmotion({
      dominant: detectedEmotion,
      confidence: confidence,
      predictions: predictions
    });

    setIsReanalyzing(false);
  };

  const handleReanalyze = () => {
    detectEmotion(content);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Saving check-in:', { content, tags, newEmotion });
    // Redirect to detail page
    window.location.href = `/check-in/${entryId}`;
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const hasChanges = content !== entry.content || JSON.stringify(tags) !== JSON.stringify(entry.tags);

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href={`/check-in/${entryId}`}
            className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back to Check-In</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReanalyze}
              disabled={content.trim().length < 10 || isReanalyzing}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isReanalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCcw className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">Re-analyze Emotions</span>
            </button>

            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">Save Changes</span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Content Editor */}
            <div className="border border-gray-200 rounded-lg p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Edit your check-in
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-96 px-4 py-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                placeholder="Update your thoughts..."
              />
              <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                <span>{content.length} characters</span>
                {isReanalyzing && (
                  <span className="flex items-center gap-1.5 text-blue-600">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Analyzing emotions...
                  </span>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="border border-gray-200 rounded-lg p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tags
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  placeholder="Add a tag..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span 
                    key={tag}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button 
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Emotion Comparison Sidebar */}
          <div className="space-y-6">
            {/* Original Emotion */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Original Analysis</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{getEmoji(originalEmotion.dominant)}</div>
                  <div className="text-lg font-bold capitalize text-gray-900">
                    {originalEmotion.dominant}
                  </div>
                  <div className="text-sm text-gray-600">
                    {originalEmotion.confidence}% confidence
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-600 mb-2">Top Predictions:</div>
                  {originalEmotion.predictions.slice(0, 3).map((pred) => (
                    <div key={pred.emotion} className="flex items-center justify-between text-xs">
                      <span className="capitalize text-gray-700">{pred.emotion}</span>
                      <span className="text-gray-600">{pred.confidence}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* New Emotion (after re-analysis) */}
            {newEmotion && (
              <div className="border-2 border-black rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-900">New Analysis</h3>
                  <span className="px-2 py-1 bg-black text-white text-xs rounded">Updated</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">{getEmoji(newEmotion.dominant)}</div>
                    <div className="text-lg font-bold capitalize text-gray-900">
                      {newEmotion.dominant}
                    </div>
                    <div className="text-sm text-gray-600">
                      {newEmotion.confidence}% confidence
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-600 mb-2">Top Predictions:</div>
                    {newEmotion.predictions.slice(0, 5).map((pred, idx) => (
                      <div key={pred.emotion} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="capitalize text-gray-700">{pred.emotion}</span>
                          <span className="text-gray-600">{pred.confidence}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${idx === 0 ? 'bg-black' : 'bg-gray-400'}`}
                            style={{ width: `${pred.confidence}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Comparison Helper */}
            {newEmotion && newEmotion.dominant !== originalEmotion.dominant && (
              <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="text-xs text-yellow-900">
                    <p className="font-medium mb-1">Emotion Changed</p>
                    <p>
                      {originalEmotion.dominant} → {newEmotion.dominant}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="border border-gray-200 rounded-lg p-4 text-xs text-gray-600">
              <p className="mb-2">💡 <strong>Tip:</strong> Edit your check-in and click "Re-analyze" to see updated emotion predictions.</p>
              <p>Changes will be saved when you click "Save Changes".</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

