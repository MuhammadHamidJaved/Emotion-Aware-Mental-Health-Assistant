'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Brain, ArrowLeft, Save, Loader2, Zap, Type, Mic, Video, Sparkles, AlertCircle } from 'lucide-react'

const EMOTION_COLORS: Record<string, string> = {
  happy: '#FCD34D', sad: '#6366F1', angry: '#EF4444', anxious: '#EC4899',
  calm: '#60A5FA', excited: '#F97316', loved: '#F472B6', confident: '#A855F7',
  frustrated: '#DC2626', tired: '#6B7280', neutral: '#9CA3AF',
  surprised: '#FBBF24', energetic: '#F59E0B', fearful: '#DC2626', disgusted: '#84CC16', disappointed: '#6366F1'
}

export default function NewCheckInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const entryType = searchParams.get('type') || 'text'
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [liveEmotion, setLiveEmotion] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [showRecommendations, setShowRecommendations] = useState(false)

  const detectEmotion = async (text: string) => {
    if (text.length < 10) {
      setLiveEmotion(null)
      return
    }

    setIsAnalyzing(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const emotions = ['happy', 'sad', 'anxious', 'calm', 'excited', 'grateful', 'frustrated', 'angry']
    const keywords: Record<string, string[]> = {
      happy: ['great', 'awesome', 'wonderful', 'excellent', 'good', 'love', 'amazing'],
      sad: ['sad', 'down', 'unhappy', 'depressed', 'tears', 'cry'],
      anxious: ['worried', 'anxious', 'nervous', 'stress', 'concerned'],
      calm: ['peaceful', 'calm', 'relaxed', 'meditation', 'serene'],
      excited: ['excited', 'cant wait', 'looking forward', 'thrilled'],
      grateful: ['thankful', 'grateful', 'appreciate', 'blessed'],
      frustrated: ['frustrated', 'annoyed', 'stuck', 'difficult'],
      angry: ['angry', 'mad', 'furious', 'hate']
    }

    let detectedEmotion = 'calm'
    let maxMatches = 0

    for (const [emotion, words] of Object.entries(keywords)) {
      const matches = words.filter(word => text.toLowerCase().includes(word)).length
      if (matches > maxMatches) {
        maxMatches = matches
        detectedEmotion = emotion
      }
    }

    const confidence = Math.min(85 + Math.random() * 10, 98)
    const predictions = emotions.map(e => ({
      emotion: e,
      confidence: e === detectedEmotion ? confidence : Math.random() * (85 - confidence)
    })).sort((a, b) => b.confidence - a.confidence)

    setLiveEmotion({
      dominant: detectedEmotion,
      confidence: confidence.toFixed(1),
      predictions: predictions.slice(0, 5),
      processingTime: Math.floor(Math.random() * 200 + 150)
    })
    
    setIsAnalyzing(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.trim()) {
        detectEmotion(content)
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [content])

  const handleSave = async () => {
    if (!content.trim() && entryType === 'text') return
    
    setIsSaving(true)
    // Simulate saving to backend
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSaving(false)
    
    // Show recommendations modal
    setShowRecommendations(true)
  }

  const handleViewRecommendations = () => {
    router.push('/recommendations')
  }

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false)
      setRecordingDuration(0)
    } else {
      setIsRecording(true)
      // Simulate recording duration
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
      setTimeout(() => {
        clearInterval(interval)
        setIsRecording(false)
      }, 5000)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const getEmoji = (emotion: string) => {
    const emojiMap: Record<string, string> = {
      happy: '😊', sad: '😢', angry: '😠', anxious: '😰', calm: '😌', excited: '🤩',
      loved: '🥰', confident: '😎', frustrated: '😤', grateful: '🙏', lonely: '😔',
      proud: '😌', scared: '😨', surprised: '😮', energetic: '⚡', peaceful: '☮️'
    }
    return emojiMap[emotion] || '😊'
  }

  return (
    <>
      <div className="min-h-screen bg-white">
        <header className="border-b border-neutral-200 bg-white sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="w-9 h-9 border border-neutral-200 rounded-lg flex items-center justify-center hover:bg-neutral-50 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold">Express Yourself</h1>
                <p className="text-sm text-neutral-600 flex items-center gap-2">
                  {entryType === 'text' && <><Type className="w-4 h-4" /> Share how you're feeling - AI will detect your emotions</>}
                  {entryType === 'voice' && <><Mic className="w-4 h-4" /> Voice your thoughts - AI will analyze your tone</>}
                  {entryType === 'video' && <><Video className="w-4 h-4" /> Video log - AI will read your expressions</>}
                </p>
              </div>
            </div>
            <button onClick={handleSave} disabled={(!content.trim() && entryType === 'text') || isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span className="font-medium">{isSaving ? 'Saving...' : 'Save Check-In'}</span>
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Input Method Selector */}
              <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm font-medium text-indigo-900 mb-3">Choose how you'd like to express yourself:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => router.push('/check-in/new?type=text')}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      entryType === 'text' 
                        ? 'border-indigo-500 bg-indigo-100 shadow-sm' 
                        : 'border-neutral-200 bg-white hover:border-indigo-400 hover:shadow-sm'
                    }`}
                  >
                    <Type className="w-5 h-5 mx-auto mb-1.5 text-indigo-600" />
                    <p className="text-xs font-medium">Text</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Quick & private</p>
                  </button>
                  <button
                    onClick={() => router.push('/check-in/new?type=voice')}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      entryType === 'voice' 
                        ? 'border-indigo-500 bg-indigo-100 shadow-sm' 
                        : 'border-neutral-200 bg-white hover:border-indigo-400 hover:shadow-sm'
                    }`}
                  >
                    <Mic className="w-5 h-5 mx-auto mb-1.5 text-indigo-600" />
                    <p className="text-xs font-medium">Voice</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Natural expression</p>
                  </button>
                  <button
                    onClick={() => router.push('/check-in/new?type=video')}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      entryType === 'video' 
                        ? 'border-indigo-500 bg-indigo-100 shadow-sm' 
                        : 'border-neutral-200 bg-white hover:border-indigo-400 hover:shadow-sm'
                    }`}
                  >
                    <Video className="w-5 h-5 mx-auto mb-1.5 text-indigo-600" />
                    <p className="text-xs font-medium">Video</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Most accurate</p>
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium mb-2 text-neutral-700">Title (Optional)</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your entry a title..."
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all"
                />
              </div>

              {/* Content Input - Text */}
              {entryType === 'text' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-700">Your Thoughts</label>
                  <textarea 
                    value={content} 
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Start writing... Our AI will analyze your emotions in real-time as you type."
                    className="w-full h-96 p-4 border border-neutral-200 rounded-lg focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 resize-none transition-all text-base leading-relaxed"
                  />
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-neutral-500">{content.length} characters • {Math.ceil(content.split(' ').filter(w => w).length)} words</span>
                    {isAnalyzing && (
                      <span className="flex items-center gap-2 text-indigo-600 font-medium">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing emotions...
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Content Input - Voice */}
              {entryType === 'voice' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-700">Voice Recording</label>
                  <div className="border-2 border-dashed border-neutral-300 rounded-lg p-12 flex flex-col items-center justify-center bg-neutral-50">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all ${isRecording ? 'bg-red-100 animate-pulse' : 'bg-neutral-200'}`}>
                      <Mic className={`w-12 h-12 ${isRecording ? 'text-red-600' : 'text-neutral-600'}`} />
                    </div>
                    {isRecording ? (
                      <>
                        <p className="text-lg font-medium mb-2">Recording...</p>
                        <p className="text-3xl font-bold text-red-600 mb-6">{Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}</p>
                        <button onClick={toggleRecording} className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                          Stop Recording
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-medium text-neutral-700 mb-2">Ready to record</p>
                        <p className="text-sm text-neutral-500 mb-6">Speak naturally. Our AI will analyze your tone and emotions.</p>
                        <button onClick={toggleRecording} className="px-8 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium">
                          Start Recording
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Content Input - Video */}
              {entryType === 'video' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-700">Video Recording</label>
                  <div className="border-2 border-dashed border-neutral-300 rounded-lg p-12 flex flex-col items-center justify-center bg-neutral-900">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all ${isRecording ? 'bg-red-100 animate-pulse' : 'bg-neutral-700'}`}>
                      <Video className={`w-12 h-12 ${isRecording ? 'text-red-600' : 'text-neutral-300'}`} />
                    </div>
                    {isRecording ? (
                      <>
                        <p className="text-lg font-medium text-white mb-2">Recording...</p>
                        <p className="text-3xl font-bold text-red-500 mb-6">{Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}</p>
                        <button onClick={toggleRecording} className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                          Stop Recording
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-medium text-white mb-2">Ready to record</p>
                        <p className="text-sm text-neutral-400 mb-6">Position your face in the center. AI will analyze your facial expressions.</p>
                        <button onClick={toggleRecording} className="px-8 py-3 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors font-medium">
                          Enable Camera
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Tags Section */}
              <div>
                <label className="block text-sm font-medium mb-2 text-neutral-700">Tags (Optional)</label>
                <div className="flex gap-2 mb-3">
                  <input 
                    type="text" 
                    value={tagInput} 
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tags like 'work', 'family', 'gratitude'..." 
                    className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all"
                  />
                  <button onClick={addTag} className="px-6 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium">
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span key={tag} className="px-3 py-1.5 bg-neutral-100 border border-neutral-200 rounded-full text-sm flex items-center gap-2 hover:bg-neutral-200 transition-colors">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-red-600 transition-colors font-bold">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* AI Emotion Detection Sidebar */}
            <div>
              <div className="sticky top-24 space-y-4">
                {/* ML Detection Panel */}
                <div className="border-2 border-indigo-200 bg-indigo-50/50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-indigo-900">AI Emotion Detection</h3>
                      <p className="text-xs text-indigo-700">Real-time ML analysis</p>
                    </div>
                  </div>

                  {!liveEmotion ? (
                    <div className="text-center py-12">
                      <Sparkles className="w-16 h-16 mx-auto mb-4 text-indigo-300" />
                      <p className="text-sm text-indigo-700 font-medium mb-1">Waiting for input...</p>
                      <p className="text-xs text-indigo-600">
                        {entryType === 'text' && 'Start typing to see live emotion analysis'}
                        {entryType === 'voice' && 'Start recording to analyze your tone'}
                        {entryType === 'video' && 'Start recording to analyze your expressions'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Dominant Emotion */}
                      <div className="text-center p-6 rounded-xl border-2 border-white bg-white shadow-sm" style={{ borderColor: EMOTION_COLORS[liveEmotion.dominant] }}>
                        <div className="text-6xl mb-3">{getEmoji(liveEmotion.dominant)}</div>
                        <div className="text-2xl font-bold capitalize mb-2" style={{ color: EMOTION_COLORS[liveEmotion.dominant] }}>
                          {liveEmotion.dominant}
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full text-sm font-medium" style={{ color: EMOTION_COLORS[liveEmotion.dominant] }}>
                          <Sparkles className="w-3.5 h-3.5" />
                          {liveEmotion.confidence}% confidence
                        </div>
                      </div>

                      {/* Emotion Breakdown */}
                      <div>
                        <div className="text-sm font-semibold mb-3 text-neutral-700">Detected Emotions</div>
                        <div className="space-y-3">
                          {liveEmotion.predictions.map((pred: any) => (
                            <div key={pred.emotion} className="bg-white rounded-lg p-3 border border-neutral-200">
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span className="capitalize font-medium flex items-center gap-2">
                                  <span>{getEmoji(pred.emotion)}</span>
                                  {pred.emotion}
                                </span>
                                <span className="font-bold" style={{ color: EMOTION_COLORS[pred.emotion] }}>
                                  {pred.confidence.toFixed(1)}%
                                </span>
                              </div>
                              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full transition-all duration-500 rounded-full" 
                                  style={{ 
                                    width: `${pred.confidence}%`,
                                    backgroundColor: EMOTION_COLORS[pred.emotion] || '#000'
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Model Info */}
                      <div className="pt-4 border-t border-indigo-200">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-indigo-700">
                            <Zap className="w-3.5 h-3.5" />
                            <span className="font-medium">{liveEmotion.processingTime}ms</span>
                          </span>
                          <span className="text-indigo-600 font-medium">
                            {entryType === 'text' && 'Text ML v2.1'}
                            {entryType === 'voice' && 'Voice ML v1.8'}
                            {entryType === 'video' && 'Video ML v3.0'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Info Card */}
                <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-neutral-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-neutral-600 leading-relaxed">
                      <p className="font-medium text-neutral-700 mb-1">How it works</p>
                      <p>Our AI analyzes your {entryType === 'text' ? 'words' : entryType === 'voice' ? 'voice tone' : 'facial expressions'} in real-time to detect emotions. This helps generate personalized wellness recommendations.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal with Recommendations */}
      {showRecommendations && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Check-In Saved Successfully!</h2>
              <p className="text-neutral-600">Your emotions have been analyzed</p>
            </div>

            {liveEmotion && (
              <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{getEmoji(liveEmotion.dominant)}</span>
                  <div>
                    <p className="text-sm text-indigo-700 font-medium">Detected Emotion</p>
                    <p className="text-lg font-bold capitalize" style={{ color: EMOTION_COLORS[liveEmotion.dominant] }}>
                      {liveEmotion.dominant} ({liveEmotion.confidence}%)
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button 
                onClick={handleViewRecommendations}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                View Personalized Recommendations
              </button>
              <button 
                onClick={handleBackToDashboard}
                className="w-full px-6 py-3 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

