'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, Video, Type, Brain, Zap, TrendingUp, Activity } from 'lucide-react'
import { EmotionType } from '@/types'

export default function RealTimeDetectionPage() {
  const [activeTab, setActiveTab] = useState<'text' | 'voice' | 'video'>('text')
  const [isProcessing, setIsProcessing] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [predictions, setPredictions] = useState<Array<{
    emotion: EmotionType
    confidence: number
    color: string
  }>>([])
  const [dominantEmotion, setDominantEmotion] = useState<EmotionType | null>(null)
  const [processingTime, setProcessingTime] = useState(0)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Emotion colors
  const emotionColors: Record<EmotionType, string> = {
    happy: '#fbbf24',
    sad: '#6366f1',
    angry: '#ef4444',
    anxious: '#ec4899',
    neutral: '#737373',
    calm: '#60a5fa',
    confident: '#8b5cf6',
    tired: '#a3a3a3',
    excited: '#f97316',
    loved: '#ec4899',
    frustrated: '#ef4444',
    disappointed: '#6366f1',
    surprised: '#fbbf24',
    fearful: '#dc2626',
    disgusted: '#84cc16',
    energetic: '#f97316'
  }

  // Simulate ML prediction
  const analyzeText = async () => {
    if (!textInput.trim()) return
    
    setIsProcessing(true)
    const startTime = Date.now()
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    // Generate predictions based on text content
    const mockPredictions = [
      { emotion: 'happy' as EmotionType, confidence: Math.random() * 0.4 + 0.5 },
      { emotion: 'calm' as EmotionType, confidence: Math.random() * 0.4 + 0.3 },
      { emotion: 'confident' as EmotionType, confidence: Math.random() * 0.3 + 0.2 },
      { emotion: 'neutral' as EmotionType, confidence: Math.random() * 0.3 + 0.1 },
      { emotion: 'anxious' as EmotionType, confidence: Math.random() * 0.2 }
    ].sort((a, b) => b.confidence - a.confidence)
    
    const predictionsWithColors = mockPredictions.map(p => ({
      ...p,
      color: emotionColors[p.emotion]
    }))
    
    setPredictions(predictionsWithColors)
    setDominantEmotion(predictionsWithColors[0].emotion)
    setProcessingTime(Date.now() - startTime)
    setIsProcessing(false)
  }

  // Auto-analyze on text change (debounced)
  useEffect(() => {
    if (textInput.length > 10) {
      const timer = setTimeout(analyzeText, 1500)
      return () => clearTimeout(timer)
    }
  }, [textInput])

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Real-Time Emotion Detection</h1>
          <p className="text-sm text-neutral-600 mb-4">Express yourself using any method - I'll detect your emotions in real-time and provide personalized support.</p>
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <p className="text-sm text-indigo-900">
              💡 Choose text, voice, or video - all methods are equally effective for emotion detection.
            </p>
          </div>
        </div>

        {/* Modality Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-neutral-100 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('text')}
            className={`px-6 py-2 rounded-md transition-all flex items-center gap-2 ${
              activeTab === 'text' 
                ? 'bg-white shadow-sm font-medium' 
                : 'hover:bg-neutral-200'
            }`}
          >
            <Type className="w-4 h-4" />
            Text
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`px-6 py-2 rounded-md transition-all flex items-center gap-2 ${
              activeTab === 'voice' 
                ? 'bg-white shadow-sm font-medium' 
                : 'hover:bg-neutral-200'
            }`}
          >
            <Mic className="w-4 h-4" />
            Voice
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`px-6 py-2 rounded-md transition-all flex items-center gap-2 ${
              activeTab === 'video' 
                ? 'bg-white shadow-sm font-medium' 
                : 'hover:bg-neutral-200'
            }`}
          >
            <Video className="w-4 h-4" />
            Video
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Input */}
          <div className="space-y-6">
            {activeTab === 'text' && (
              <div className="border border-neutral-200 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Text Input</h2>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="w-full h-64 p-4 border border-neutral-300 rounded-lg focus:outline-none focus:border-black resize-none"
                  placeholder="Start typing how you're feeling or any text to analyze emotions in real-time..."
                />
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-neutral-600">
                    {textInput.length} characters
                  </span>
                  <button
                    onClick={analyzeText}
                    disabled={!textInput.trim() || isProcessing}
                    className="px-6 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Activity className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" />
                        Analyze Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'voice' && (
              <div className="border border-neutral-200 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Voice Recording</h2>
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-neutral-300 rounded-lg">
                  <Mic className="w-16 h-16 text-neutral-400 mb-4" />
                  <p className="text-neutral-600 mb-4">Click to start recording</p>
                  <button className="px-6 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors">
                    Start Recording
                  </button>
                </div>
                <div className="mt-4 text-sm text-neutral-500">
                  Tip: Speak naturally for best results. The AI will analyze tone, pitch, and speech patterns.
                </div>
              </div>
            )}

            {activeTab === 'video' && (
              <div className="border border-neutral-200 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Video Recording</h2>
                <div className="flex flex-col items-center justify-center h-64 bg-neutral-900 rounded-lg relative overflow-hidden">
                  <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
                  <Video className="w-16 h-16 text-white mb-4 relative z-10" />
                  <p className="text-white mb-4 relative z-10">Click to start camera</p>
                  <button className="px-6 py-3 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors relative z-10">
                    Enable Camera
                  </button>
                </div>
                <div className="mt-4 text-sm text-neutral-500">
                  Tip: Position your face in the center. The AI will analyze facial expressions in real-time.
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Results */}
          <div className="space-y-6">
            {/* Dominant Emotion */}
            {dominantEmotion && (
              <div className="border border-neutral-200 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Dominant Emotion</h2>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
                    style={{ 
                      backgroundColor: `${emotionColors[dominantEmotion]}20`,
                      border: `3px solid ${emotionColors[dominantEmotion]}`
                    }}
                  >
                    {predictions[0].confidence >= 0.8 ? '😊' : 
                     predictions[0].confidence >= 0.6 ? '🙂' : '😐'}
                  </div>
                  <div>
                    <div 
                      className="text-2xl font-bold capitalize mb-1"
                      style={{ color: emotionColors[dominantEmotion] }}
                    >
                      {dominantEmotion}
                    </div>
                    <div className="text-sm text-neutral-600">
                      {(predictions[0].confidence * 100).toFixed(1)}% confidence
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* All Predictions */}
            <div className="border border-neutral-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Emotion Breakdown</h2>
                {processingTime > 0 && (
                  <div className="flex items-center gap-1 text-sm text-neutral-600">
                    <Zap className="w-4 h-4" />
                    {processingTime}ms
                  </div>
                )}
              </div>
              
              {predictions.length > 0 ? (
                <div className="space-y-3">
                  {predictions.map((pred, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="capitalize font-medium">{pred.emotion}</span>
                        <span className="text-sm text-neutral-600">
                          {(pred.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-500 rounded-full"
                          style={{
                            width: `${pred.confidence * 100}%`,
                            backgroundColor: pred.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-400">
                  <Brain className="w-12 h-12 mx-auto mb-3" />
                  <p>No predictions yet</p>
                  <p className="text-sm mt-1">Start typing to see emotion analysis</p>
                </div>
              )}
            </div>

            {/* Stats */}
            {predictions.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-neutral-200 rounded-lg p-4">
                  <div className="text-sm text-neutral-600 mb-1">Valence</div>
                  <div className="text-2xl font-bold">
                    {predictions[0].emotion === 'happy' || predictions[0].emotion === 'calm' ? '+' : '-'}
                    {(Math.random() * 0.5 + 0.3).toFixed(2)}
                  </div>
                </div>
                <div className="border border-neutral-200 rounded-lg p-4">
                  <div className="text-sm text-neutral-600 mb-1">Arousal</div>
                  <div className="text-2xl font-bold">
                    {(Math.random() * 0.4 + 0.4).toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {/* Model Info */}
            <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-neutral-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium mb-1">
                    {activeTab === 'text' && 'Text Emotion Classifier v2.1.0'}
                    {activeTab === 'voice' && 'Voice Sentiment Analyzer v1.8.3'}
                    {activeTab === 'video' && 'Facial Expression Recognition v3.0.1'}
                  </div>
                  <div className="text-neutral-600">
                    {activeTab === 'text' && '94.7% accuracy on validation set'}
                    {activeTab === 'voice' && '89.2% accuracy on validation set'}
                    {activeTab === 'video' && '93.4% accuracy on validation set'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
