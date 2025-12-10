'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Brain, ArrowLeft, Save, Loader2, Zap, Type, Mic, Video, Sparkles, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

const EMOTION_COLORS: Record<string, string> = {
  happy: '#FCD34D', sad: '#6366F1', angry: '#EF4444', anxious: '#EC4899',
  calm: '#60A5FA', excited: '#F97316', loved: '#F472B6', confident: '#A855F7',
  frustrated: '#DC2626', tired: '#6B7280', neutral: '#9CA3AF',
  surprised: '#FBBF24', energetic: '#F59E0B', fearful: '#DC2626', disgusted: '#84CC16', disappointed: '#6366F1'
}

export default function NewCheckInPage() {
  console.log('[COMPONENT] NewCheckInPage rendering')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { getAccessToken } = useAuth()
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
  const [isPredicting, setIsPredicting] = useState(false) // Track if prediction is active
  
  // Webcam and video states
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isPredictingRef = useRef<boolean>(false) // Use ref to track prediction state in intervals
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [finalEmotion, setFinalEmotion] = useState<any>(null) // Store final emotion for saving
  const [recommendations, setRecommendations] = useState<any>(null) // Store recommendations from microservice

  const detectEmotion = async (text: string) => {
    // Minimum text length for better accuracy (microservice accepts 1 char, but we use 3 for better results)
    if (text.length < 3) {
      setLiveEmotion(null)
      return
    }

    setIsAnalyzing(true)
    
    try {
      // Get access token from auth context
      const token = getAccessToken()
      if (!token) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      // Call Django backend which will call the text emotion microservice
      const response = await fetch('http://localhost:8000/api/journal/emotion/detect/text/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: text
        })
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.')
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || 'Failed to detect emotion')
      }
      
      const data = await response.json()
      
      if (data.success) {
        // Map microservice emotion to our emotion format
        const predictedEmotion = data.predicted_emotion.toLowerCase()
        const confidence = (data.confidence * 100).toFixed(1)
        
        // Convert all_scores to predictions array
        const predictions = Object.entries(data.all_scores || {}).map(([emotion, score]: [string, any]) => ({
          emotion: emotion.toLowerCase(),
          confidence: (score * 100).toFixed(1)
        })).sort((a: any, b: any) => parseFloat(b.confidence) - parseFloat(a.confidence))
        
        const emotionData = {
          dominant: predictedEmotion,
          confidence: confidence,
          predictions: predictions.slice(0, 5),
          processingTime: data.processing_time_ms || 0,
          allScores: data.all_scores,
          top3: data.top_3
        }
        
        console.log('✅ Updating emotion in real-time:', emotionData.dominant, emotionData.confidence + '%')
        setLiveEmotion(emotionData)
        setFinalEmotion(emotionData) // Store for saving (always update with latest)
        
        // Store recommendations if available
        if (data.recommendations) {
          console.log('Received recommendations:', data.recommendations);
          console.log('Music data:', data.recommendations.music);
          setRecommendations(data.recommendations)
          // Also store in localStorage for recommendations page
          localStorage.setItem('lastRecommendations', JSON.stringify({
            emotion: predictedEmotion,
            confidence: confidence,
            recommendations: data.recommendations,
            timestamp: new Date().toISOString()
          }))
        } else {
          console.warn('No recommendations in response:', data);
        }
      }
    } catch (error: any) {
      console.error('Error detecting emotion:', error)
      // Don't show error if it's just a short text
      if (text.length >= 10) {
        setCameraError(error.message || 'Failed to detect emotion. Please try again.')
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.trim() && entryType === 'text') {
        detectEmotion(content)
      }
    }, 1500) // Debounce: wait 1.5 seconds after user stops typing
    return () => clearTimeout(timer)
  }, [content, entryType])

  // Debug: Log when liveEmotion changes
  useEffect(() => {
    if (liveEmotion) {
      console.log('🎭 UI Updated - Now showing:', liveEmotion.dominant, liveEmotion.confidence + '%')
    } else {
      console.log('🎭 UI Updated - Waiting for input')
    }
  }, [liveEmotion])

  const handleSave = async () => {
    if (!content.trim() && entryType === 'text') return
    if (entryType === 'video' && !finalEmotion) {
      alert('Please record a video to detect your emotion first.')
      return
    }
    
    setIsSaving(true)
    
    try {
      // Stop webcam if recording
      if (isRecording) {
        stopWebcam()
      }
      
      // Prepare entry data
      const entryData: any = {
        entry_type: entryType,
        title: title.trim() || undefined,
        tags: tags,
        is_draft: false,
        entry_date: new Date().toISOString()
      }
      
      if (entryType === 'text') {
        entryData.text_content = content.trim()
      } else if (entryType === 'video') {
        entryData.transcription = content.trim() || 'Video entry'
        entryData.duration = recordingDuration
      }
      
      // Add emotion data if available
      if (liveEmotion || finalEmotion) {
        const emotionData = finalEmotion || liveEmotion
        entryData.emotion = emotionData.dominant
        entryData.emotion_confidence = parseFloat(emotionData.confidence) / 100
      }
      
      // Get access token from auth context
      const token = getAccessToken()
      if (!token) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      // Save to backend
      const response = await fetch('http://localhost:8000/api/journal/entries/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(entryData)
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.')
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || errorData.detail || 'Failed to save entry')
      }
      
      const savedEntry = await response.json()
      console.log('Entry saved:', savedEntry)
      
      // Show recommendations modal
      setShowRecommendations(true)
    } catch (error: any) {
      console.error('Error saving entry:', error)
      alert(error.message || 'Failed to save entry. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleViewRecommendations = () => {
    router.push('/recommendations')
  }

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  // Convert canvas to base64
  const captureFrame = (): string | null => {
    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return null
    }
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Convert to base64
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1] // Remove data:image/jpeg;base64, prefix
  }

  // Call microservice to detect emotion
  const detectEmotionFromFrame = async (imageDataBase64: string) => {
    // Don't detect if prediction is paused
    if (!isPredictingRef.current) {
      return
    }
    
    try {
      setIsAnalyzing(true)
      
      // Get access token from auth context
      const token = getAccessToken()
      if (!token) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      // Call Django backend which will call the microservice
      const response = await fetch('http://localhost:8000/api/journal/emotion/detect/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          image_data: imageDataBase64
        })
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.')
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || 'Failed to detect emotion')
      }
      
      const data = await response.json()
      console.log('Emotion detection API response:', data)
      
      // Check for success (handle both boolean true and string "true")
      if (data.success === true || data.success === 'true') {
        // Map microservice emotion to our emotion format
        const predictedEmotion = (data.predicted_emotion || '').toLowerCase()
        const confidence = data.confidence ? (data.confidence * 100).toFixed(1) : '0.0'
        
        // Convert all_scores to predictions array
        const predictions = Object.entries(data.all_scores || {}).map(([emotion, score]: [string, any]) => ({
          emotion: emotion.toLowerCase(),
          confidence: (score * 100).toFixed(1)
        })).sort((a: any, b: any) => parseFloat(b.confidence) - parseFloat(a.confidence))
        
        const emotionData = {
          dominant: predictedEmotion,
          confidence: confidence,
          predictions: predictions.slice(0, 5),
          processingTime: data.processing_time_ms || 0,
          allScores: data.all_scores,
          top3: data.top_3
        }
        
        console.log('✅ Updating emotion in real-time:', emotionData.dominant, emotionData.confidence + '%')
        console.log('[STATE UPDATE] Calling setLiveEmotion with:', emotionData)
        console.log('[STATE UPDATE] Current liveEmotion before setState:', liveEmotion)
        setLiveEmotion(emotionData)
        setFinalEmotion(emotionData) // Store for saving (always update with latest)
        
        // Force a re-render by also updating a dummy state if needed
        console.log('[STATE UPDATE] setLiveEmotion called, React should re-render now')
        
        // Store recommendations if available (only update if we have new ones)
        if (data.recommendations) {
          console.log('Received recommendations:', data.recommendations);
          console.log('Music data:', data.recommendations.music);
          setRecommendations(data.recommendations)
          // Also store in localStorage for recommendations page
          localStorage.setItem('lastRecommendations', JSON.stringify({
            emotion: predictedEmotion,
            confidence: confidence,
            recommendations: data.recommendations,
            timestamp: new Date().toISOString()
          }))
        } else {
          console.warn('No recommendations in response:', data);
        }
      } else {
        console.warn('Emotion detection response did not have success=true:', data)
        // Try to extract emotion data even if success is not explicitly true
        if (data.predicted_emotion) {
          const predictedEmotion = (data.predicted_emotion || '').toLowerCase()
          const confidence = data.confidence ? (data.confidence * 100).toFixed(1) : '0.0'
          
          const predictions = Object.entries(data.all_scores || {}).map(([emotion, score]: [string, any]) => ({
            emotion: emotion.toLowerCase(),
            confidence: (score * 100).toFixed(1)
          })).sort((a: any, b: any) => parseFloat(b.confidence) - parseFloat(a.confidence))
          
          const emotionData = {
            dominant: predictedEmotion,
            confidence: confidence,
            predictions: predictions.slice(0, 5),
            processingTime: data.processing_time_ms || 0,
            allScores: data.all_scores,
            top3: data.top_3
          }
          
          console.log('✅ Updating emotion in real-time (fallback):', emotionData.dominant, emotionData.confidence + '%')
          setLiveEmotion(emotionData)
          setFinalEmotion(emotionData)
        }
      }
    } catch (error: any) {
      console.error('Error detecting emotion:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        isPredicting: isPredictingRef.current
      })
      // Don't show error if prediction was stopped
      if (isPredictingRef.current) {
        setCameraError(error.message || 'Failed to detect emotion. Please try again.')
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Start webcam
  const startWebcam = async () => {
    try {
      setCameraError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      
      setIsRecording(true)
      setRecordingDuration(0)
      setIsPredicting(true) // Start prediction automatically when recording starts
      isPredictingRef.current = true // Update ref as well
      
      // Start capturing frames every 1.5 seconds for more frequent updates
      // Wait a bit for video to be ready before starting capture
      setTimeout(() => {
        captureIntervalRef.current = setInterval(() => {
          const frame = captureFrame()
          if (frame && isPredictingRef.current) {
            console.log('Capturing frame for emotion detection, isPredicting:', isPredictingRef.current)
            detectEmotionFromFrame(frame)
          } else if (!frame) {
            console.warn('Frame capture returned null - video may not be ready')
          } else {
            console.log('Skipping detection - prediction is paused')
          }
        }, 1500) // Capture every 1.5 seconds
      }, 1000) // Wait 1 second for video to stabilize
      
      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
      
    } catch (error: any) {
      console.error('Error accessing webcam:', error)
      setCameraError(error.message || 'Failed to access camera. Please check permissions.')
      setIsRecording(false)
      setIsPredicting(false)
    }
  }

  // Stop webcam
  const stopWebcam = () => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current)
      captureIntervalRef.current = null
    }
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
      setIsRecording(false)
      setIsPredicting(false) // Stop prediction when recording stops
      isPredictingRef.current = false // Update ref as well
      setRecordingDuration(0)
  }

  // Toggle prediction (pause/resume) without stopping recording
  const togglePrediction = () => {
    setIsPredicting(prev => {
      const newValue = !prev
      isPredictingRef.current = newValue // Update ref synchronously
      if (newValue) {
        // If resuming prediction, immediately capture a frame
        setTimeout(() => {
          const frame = captureFrame()
          if (frame) {
            detectEmotionFromFrame(frame)
          }
        }, 100)
      }
      return newValue
    })
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopWebcam()
    } else {
      startWebcam()
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam()
    }
  }, [])

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
                  <div className="border-2 border-dashed border-neutral-300 rounded-lg p-4 bg-neutral-900 relative overflow-hidden">
                    {/* Hidden canvas for frame capture */}
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {/* Video element */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-auto rounded-lg ${isRecording ? 'block' : 'hidden'}`}
                    />
                    
                    {/* Placeholder when not recording */}
                    {!isRecording && (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 bg-neutral-700">
                          <Video className="w-12 h-12 text-neutral-300" />
                        </div>
                        <p className="text-lg font-medium text-white mb-2">Ready to record</p>
                        <p className="text-sm text-neutral-400 mb-6 text-center px-4">
                          Position your face in the center. AI will analyze your facial expressions in real-time.
                        </p>
                        <button 
                          onClick={toggleRecording} 
                          className="px-8 py-3 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors font-medium"
                        >
                          Enable Camera
                        </button>
                      </div>
                    )}
                    
                    {/* Recording controls */}
                    {isRecording && (
                      <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-4">
                        <div className="bg-black/70 rounded-lg px-6 py-3">
                          <p className="text-lg font-medium text-white mb-1">Recording...</p>
                          <p className="text-3xl font-bold text-red-500">
                            {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <button 
                            onClick={togglePrediction} 
                            className={`px-6 py-3 rounded-lg transition-colors font-medium ${
                              isPredicting 
                                ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                                : 'bg-gray-600 text-white hover:bg-gray-700'
                            }`}
                            title={isPredicting ? 'Pause emotion detection' : 'Resume emotion detection'}
                          >
                            {isPredicting ? '⏸ Pause Detection' : '▶ Resume Detection'}
                          </button>
                          <button 
                            onClick={toggleRecording} 
                            className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                          >
                            Stop Recording
                          </button>
                        </div>
                        {isPredicting && (
                          <p className="text-xs text-green-400 font-medium">
                            🧠 AI is analyzing your emotions in real-time
                          </p>
                        )}
                        {!isPredicting && isRecording && (
                          <p className="text-xs text-yellow-400 font-medium">
                            ⏸ Emotion detection paused
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Error message */}
                    {cameraError && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">{cameraError}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Optional text content for video entries */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2 text-neutral-700">Additional Notes (Optional)</label>
                    <textarea 
                      value={content} 
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Add any additional thoughts or context about this moment..."
                      className="w-full h-32 p-4 border border-neutral-200 rounded-lg focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 resize-none transition-all text-base leading-relaxed"
                    />
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

                  {/* Debug Info */}
                  {console.log('[RENDER] Component rendering, liveEmotion:', liveEmotion)}
                  {console.log('[RENDER] isRecording:', isRecording, 'isPredicting:', isPredicting, 'isAnalyzing:', isAnalyzing)}
                  {console.log('[RENDER] Conditional check (!liveEmotion):', !liveEmotion)}

                  {!liveEmotion ? (
                    <div className="text-center py-12">
                      <Sparkles className="w-16 h-16 mx-auto mb-4 text-indigo-300" />
                      <p className="text-sm text-indigo-700 font-medium mb-1">Waiting for input...</p>
                      <p className="text-xs text-indigo-600">
                        {entryType === 'text' && 'Start typing to see live emotion analysis'}
                        {entryType === 'voice' && 'Start recording to analyze your tone'}
                        {entryType === 'video' && isRecording && !isPredicting && 'Recording... Click "Resume Detection" to analyze emotions'}
                        {entryType === 'video' && isRecording && isPredicting && 'Analyzing your expressions in real-time...'}
                        {entryType === 'video' && !isRecording && 'Start recording to analyze your expressions'}
                      </p>
                      {isAnalyzing && (
                        <div className="mt-4 flex items-center justify-center gap-2 text-indigo-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs">Processing emotion...</span>
                        </div>
                      )}
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
                                <span className="font-bold" style={{ color: EMOTION_COLORS[pred.emotion] || '#000' }}>
                                  {typeof pred.confidence === 'string' ? pred.confidence : pred.confidence.toFixed(1)}%
                                </span>
                              </div>
                              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full transition-all duration-500 rounded-full" 
                                  style={{ 
                                    width: `${typeof pred.confidence === 'string' ? parseFloat(pred.confidence) : pred.confidence}%`,
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
                      
                      {/* Recommendations Preview */}
                      {recommendations && (
                        <div className="pt-4 border-t border-indigo-200 mt-4">
                          <div className="text-sm font-semibold mb-3 text-indigo-900">Personalized Recommendations</div>
                          <div className="space-y-2">
                            {recommendations.music?.playlist_url && (
                              <a 
                                href={recommendations.music.playlist_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block p-2 bg-white rounded-lg border border-indigo-200 hover:border-indigo-400 transition-colors text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-purple-600">🎵</span>
                                  <span className="font-medium">Music Playlist</span>
                                </div>
                              </a>
                            )}
                            {recommendations.quote && (
                              <div className="p-2 bg-white rounded-lg border border-indigo-200 text-xs">
                                <div className="flex items-start gap-2">
                                  <span className="text-pink-600">💬</span>
                                  <div>
                                    <p className="italic">"{recommendations.quote}"</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {recommendations.activity && (
                              <div className="p-2 bg-white rounded-lg border border-indigo-200 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-orange-600">🎯</span>
                                  <span>{recommendations.activity}</span>
                                </div>
                              </div>
                            )}
                            <Link 
                              href="/recommendations"
                              className="block text-center text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-2"
                            >
                              View All Recommendations →
                            </Link>
                          </div>
                        </div>
                      )}
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

