'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Brain, Save, Loader2, Zap, Type, Mic, Video, Sparkles, AlertCircle, Clock, PenLine } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { API_URL } from '@/lib/api'
import PageHeading from '@/components/PageHeading'

const EMOTION_COLORS: Record<string, string> = {
  happy: '#FCD34D', sad: '#6366F1', angry: '#EF4444', anxious: '#EC4899',
  calm: '#60A5FA', excited: '#F97316', loved: '#F472B6', confident: '#A855F7',
  frustrated: '#DC2626', tired: '#6B7280', neutral: '#9CA3AF',
  surprised: '#FBBF24', energetic: '#F59E0B', fearful: '#DC2626', disgusted: '#84CC16', disappointed: '#6366F1'
}

export default function NewCheckInPage() {
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
  const [finalEmotion, setFinalEmotion] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any>(null)
  const [emotionHistory, setEmotionHistory] = useState<Array<{
    emotion: string
    confidence: string
    predictions: any[]
    timestamp: number
    processingTime: number
  }>>([])
  const detectionActiveRef = useRef(false)
  const recordingStartRef = useRef(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [voiceError, setVoiceError] = useState<string | null>(null)

  /** Camera/mic APIs require a secure context (HTTPS or localhost). Plain http:// + LAN IP is blocked on mobile Chrome. */
  const [cameraGate, setCameraGate] = useState<'pending' | 'ok' | 'needs_https' | 'no_api'>('pending')

  useEffect(() => {
    if (entryType !== 'video') {
      setCameraGate('ok')
      return
    }
    if (typeof window === 'undefined') return
    if (!window.isSecureContext) {
      setCameraGate('needs_https')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraGate('no_api')
      return
    }
    setCameraGate('ok')
  }, [entryType])

  /** Mic recording needs secure context (same as camera) on many browsers. */
  const [voiceGate, setVoiceGate] = useState<'pending' | 'ok' | 'needs_https' | 'no_api'>('pending')
  useEffect(() => {
    if (entryType !== 'voice') {
      setVoiceGate('ok')
      return
    }
    if (typeof window === 'undefined') return
    if (!window.isSecureContext) {
      setVoiceGate('needs_https')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceGate('no_api')
      return
    }
    setVoiceGate('ok')
  }, [entryType])

  const HTTPS_CAMERA_HELP =
    'Video needs a secure page (HTTPS) or localhost. Opening this site as http:// on your Wi‑Fi IP blocks the camera on phones. Options: use an HTTPS tunnel (ngrok, Cloudflare Tunnel), serve Next.js over HTTPS in dev (mkcert), or test video on a desktop browser.'

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
      const response = await fetch(`${API_URL}/api/assistant/emotion/detect/text/`, {
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

  const handleSave = async () => {
    if (!content.trim() && entryType === 'text') return
    if (entryType === 'voice' && isRecording) {
      alert('Please stop recording before saving.')
      return
    }
    if (entryType === 'video' && !finalEmotion) {
      alert('Please record a video to detect your emotion first.')
      return
    }
    if (entryType === 'voice' && !finalEmotion) {
      alert('Please record your voice so we can detect your emotion.')
      return
    }

    setIsSaving(true)

    try {
      if (entryType === 'video' && isRecording) {
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
      } else if (entryType === 'voice') {
        entryData.transcription = content.trim() || 'Voice check-in'
        entryData.duration = recordingDuration
      }

      // Use session-dominant emotion when history is available (more representative than last frame)
      if (entryType === 'video' && emotionHistory.length >= 2 && sessionSummary) {
        entryData.emotion = sessionSummary.dominant
        entryData.emotion_confidence = parseFloat(sessionSummary.avgConfidence) / 100
      } else if (liveEmotion || finalEmotion) {
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
      const response = await fetch(`${API_URL}/api/assistant/entries/`, {
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

      // Call Django backend which will call the 7-class emotion microservice
      const response = await fetch(`${API_URL}/api/assistant/emotion/detect/7class/`, {
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
        const errorMessage = errorData.error || errorData.message || errorData.details || 'Failed to detect emotion. Please ensure the 7-class emotion microservice is running on port 5002.'
        console.error('Emotion detection API error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        })
        throw new Error(errorMessage)
      }

      const data = await response.json()

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

        setLiveEmotion(emotionData)
        setFinalEmotion(emotionData)
        setEmotionHistory(prev => [...prev, {
          emotion: predictedEmotion,
          confidence,
          predictions: predictions.slice(0, 5),
          timestamp: Date.now(),
          processingTime: data.processing_time_ms || 0
        }])

        // Store recommendations if available (only update if we have new ones)
        if (data.recommendations) {
          setRecommendations(data.recommendations)
          localStorage.setItem('lastRecommendations', JSON.stringify({
            emotion: predictedEmotion,
            confidence: confidence,
            recommendations: data.recommendations,
            timestamp: new Date().toISOString()
          }))
        }
      } else {
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

          setLiveEmotion(emotionData)
          setFinalEmotion(emotionData)
          setEmotionHistory(prev => [...prev, {
            emotion: predictedEmotion,
            confidence,
            predictions: predictions.slice(0, 5),
            timestamp: Date.now(),
            processingTime: data.processing_time_ms || 0
          }])
        }
      }
    } catch (error: any) {
      console.error('Error detecting emotion:', error.message)
      if (isPredictingRef.current) {
        setCameraError(error.message || 'Failed to detect emotion. Please try again.')
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Non-overlapping detection loop: waits for each call to finish before scheduling the next
  const runNextDetection = async () => {
    if (!detectionActiveRef.current || !isPredictingRef.current) return

    const frame = captureFrame()
    if (frame) {
      await detectEmotionFromFrame(frame)
    }

    if (detectionActiveRef.current && isPredictingRef.current) {
      setTimeout(runNextDetection, 500)
    }
  }

  const startWebcam = async () => {
    try {
      setCameraError(null)

      if (typeof window !== 'undefined' && !window.isSecureContext) {
        setCameraError(HTTPS_CAMERA_HELP)
        return
      }
      const md = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined
      if (!md?.getUserMedia) {
        setCameraError(
          'Camera API is not available. On mobile, use HTTPS or localhost; otherwise update your browser.'
        )
        return
      }

      const stream = await md.getUserMedia({
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

      recordingStartRef.current = Date.now()
      setEmotionHistory([])

      // Start continuous detection loop after brief init delay
      setTimeout(() => {
        detectionActiveRef.current = true
        runNextDetection()
      }, 500)

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
    detectionActiveRef.current = false

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

  const releaseVoiceResources = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }
    audioStreamRef.current?.getTracks().forEach(t => t.stop())
    audioStreamRef.current = null
    mediaRecorderRef.current = null
    audioChunksRef.current = []
    setIsRecording(false)
  }

  const detectEmotionFromVoiceBlob = async (blob: Blob) => {
    setIsAnalyzing(true)
    setVoiceError(null)
    try {
      const token = getAccessToken()
      if (!token) {
        throw new Error('Authentication required. Please log in again.')
      }
      const formData = new FormData()
      formData.append('file', blob, 'recording.webm')
      const response = await fetch(`${API_URL}/api/assistant/emotion/detect/audio/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.')
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || errorData.details || 'Failed to analyze voice')
      }

      const data = await response.json()

      if (data.success) {
        const predictedEmotion = data.predicted_emotion.toLowerCase()
        const confidence = (data.confidence * 100).toFixed(1)
        const predictions = Object.entries(data.all_scores || {}).map(([emotion, score]: [string, any]) => ({
          emotion: emotion.toLowerCase(),
          confidence: (Number(score) * 100).toFixed(1)
        })).sort((a: any, b: any) => parseFloat(b.confidence) - parseFloat(a.confidence))

        const emotionData = {
          dominant: predictedEmotion,
          confidence,
          predictions: predictions.slice(0, 5),
          processingTime: data.processing_time_ms || 0,
          allScores: data.all_scores,
          top3: data.top_3
        }

        setLiveEmotion(emotionData)
        setFinalEmotion(emotionData)

        if (data.recommendations) {
          setRecommendations(data.recommendations)
          localStorage.setItem('lastRecommendations', JSON.stringify({
            emotion: predictedEmotion,
            confidence,
            recommendations: data.recommendations,
            timestamp: new Date().toISOString()
          }))
        }
      }
    } catch (error: any) {
      console.error('Voice emotion error:', error)
      setVoiceError(error.message || 'Failed to analyze voice. Ensure the voice service is running on port 5003.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const startVoiceRecording = async () => {
    setVoiceError(null)
    if (voiceGate !== 'ok') return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream
      audioChunksRef.current = []
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : ''
      const mr = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      mr.start(250)
      setLiveEmotion(null)
      setFinalEmotion(null)
      setRecommendations(null)
      setRecordingDuration(0)
      recordingStartRef.current = Date.now()
      setIsRecording(true)
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    } catch (error: any) {
      console.error('Voice recording error:', error)
      setVoiceError(error.message || 'Could not access microphone.')
    }
  }

  const stopVoiceRecording = async () => {
    const mr = mediaRecorderRef.current
    if (!mr || mr.state === 'inactive') {
      releaseVoiceResources()
      return
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }

    const mimeType = mr.mimeType
    await new Promise<void>((resolve) => {
      mr.onstop = () => resolve()
      mr.stop()
    })

    audioStreamRef.current?.getTracks().forEach(t => t.stop())
    audioStreamRef.current = null
    mediaRecorderRef.current = null
    setIsRecording(false)

    const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' })
    audioChunksRef.current = []

    if (blob.size < 256) {
      setVoiceError('Recording too short. Speak for at least a second, then stop.')
      return
    }

    await detectEmotionFromVoiceBlob(blob)
  }

  // Toggle prediction (pause/resume) without stopping recording
  const togglePrediction = () => {
    setIsPredicting(prev => {
      const newValue = !prev
      isPredictingRef.current = newValue
      if (newValue && detectionActiveRef.current) {
        runNextDetection()
      }
      return newValue
    })
  }

  const toggleVideoRecording = () => {
    if (isRecording) {
      stopWebcam()
    } else {
      startWebcam()
    }
  }

  useEffect(() => {
    if (entryType === 'text') {
      stopWebcam()
      releaseVoiceResources()
    } else if (entryType === 'voice') {
      stopWebcam()
    } else if (entryType === 'video') {
      releaseVoiceResources()
    }
  }, [entryType])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam()
      releaseVoiceResources()
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
      proud: '😌', scared: '😨', surprised: '😮', energetic: '⚡', peaceful: '☮️',
      neutral: '😐', disgusted: '🤢', fearful: '😨', contempt: '😒',
    }
    return emojiMap[emotion] || '😊'
  }

  const sessionSummary = useMemo(() => {
    if (emotionHistory.length < 2) return null
    const freq: Record<string, { count: number; totalConf: number }> = {}
    emotionHistory.forEach(e => {
      if (!freq[e.emotion]) freq[e.emotion] = { count: 0, totalConf: 0 }
      freq[e.emotion].count += 1
      freq[e.emotion].totalConf += parseFloat(e.confidence)
    })
    const sorted = Object.entries(freq).sort((a, b) => b[1].count - a[1].count)
    return {
      dominant: sorted[0][0],
      dominantPct: Math.round(sorted[0][1].count / emotionHistory.length * 100),
      avgConfidence: (sorted[0][1].totalConf / sorted[0][1].count).toFixed(1),
      uniqueCount: sorted.length,
      total: emotionHistory.length,
    }
  }, [emotionHistory])

  const expressSubtitle =
    entryType === 'text'
      ? 'Share how you feel — AI detects emotions as you write'
      : entryType === 'voice'
        ? 'Speak naturally — we analyze tone and mood'
        : 'Video log — AI reads your facial expressions in real time'

  return (
    <>
      <PageHeading
        icon={PenLine}
        title="Express Yourself"
        subtitle={expressSubtitle}
        actions={
          <button
            type="button"
            onClick={handleSave}
            disabled={(!content.trim() && entryType === 'text') || isSaving}
            className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Save check-in'}
          </button>
        }
      />

      <div className="bg-gray-50 -mx-4 sm:-mx-6 mt-2 sm:mt-3 rounded-xl border border-neutral-100/80 shadow-sm overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 pb-6 sm:pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Input Method Selector */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm font-medium text-indigo-900 mb-3">Choose how you'd like to express yourself:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => router.push('/check-in/new?type=text')}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${entryType === 'text'
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
                    className={`p-3 rounded-lg border-2 transition-all text-center ${entryType === 'voice'
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
                    className={`p-3 rounded-lg border-2 transition-all text-center ${entryType === 'video'
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
                    className="w-full h-60 sm:h-96 p-4 border border-neutral-200 rounded-lg focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 resize-none transition-all text-base leading-relaxed"
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
                  {voiceGate === 'needs_https' && (
                    <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-950">
                      <p className="font-medium flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        Microphone unavailable on this connection
                      </p>
                      <p className="mt-2 text-amber-900/90 leading-relaxed">{HTTPS_CAMERA_HELP}</p>
                    </div>
                  )}
                  {voiceGate === 'no_api' && (
                    <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-950">
                      <p className="font-medium">Microphone API not exposed in this browser.</p>
                      <p className="mt-1 text-amber-900/90">Try Chrome or Safari, or update your browser.</p>
                    </div>
                  )}
                  <div className="border-2 border-dashed border-neutral-300 rounded-lg p-12 flex flex-col items-center justify-center bg-neutral-50">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all ${isRecording ? 'bg-red-100 animate-pulse' : 'bg-neutral-200'}`}>
                      <Mic className={`w-12 h-12 ${isRecording ? 'text-red-600' : 'text-neutral-600'}`} />
                    </div>
                    {isRecording ? (
                      <>
                        <p className="text-lg font-medium mb-2">Recording...</p>
                        <p className="text-3xl font-bold text-red-600 mb-6">{Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}</p>
                        <button
                          type="button"
                          onClick={() => void stopVoiceRecording()}
                          className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                          Stop &amp; analyze
                        </button>
                        <p className="text-xs text-neutral-500 mt-3 max-w-sm text-center">
                          We send audio to the voice model (port 5003) after you stop.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-medium text-neutral-700 mb-2">Ready to record</p>
                        <p className="text-sm text-neutral-500 mb-6 text-center max-w-md">
                          Speak naturally. When you stop, we analyze your voice with the Wav2Vec2 service.
                        </p>
                        <button
                          type="button"
                          onClick={() => void startVoiceRecording()}
                          disabled={voiceGate === 'needs_https' || voiceGate === 'no_api' || voiceGate === 'pending'}
                          className="px-8 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {voiceGate === 'pending' ? 'Checking…' : 'Start Recording'}
                        </button>
                      </>
                    )}
                    {isAnalyzing && !isRecording && (
                      <p className="mt-6 flex items-center gap-2 text-sm text-indigo-600 font-medium">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing voice…
                      </p>
                    )}
                    {voiceError && (
                      <div className="mt-4 p-3 w-full max-w-md bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                        {voiceError}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Content Input - Video */}
              {entryType === 'video' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-700">Video Recording</label>
                  {cameraGate === 'needs_https' && (
                    <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-950">
                      <p className="font-medium flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        Camera unavailable on this connection
                      </p>
                      <p className="mt-2 text-amber-900/90 leading-relaxed">{HTTPS_CAMERA_HELP}</p>
                    </div>
                  )}
                  {cameraGate === 'no_api' && (
                    <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-950">
                      <p className="font-medium">Camera API not exposed in this browser.</p>
                      <p className="mt-1 text-amber-900/90">Try Chrome or Safari, or update your browser.</p>
                    </div>
                  )}
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
                          type="button"
                          onClick={toggleVideoRecording}
                          disabled={cameraGate === 'needs_https' || cameraGate === 'no_api' || cameraGate === 'pending'}
                          className="px-8 py-3 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cameraGate === 'pending' ? 'Checking…' : 'Enable Camera'}
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
                            className={`px-6 py-3 rounded-lg transition-colors font-medium ${isPredicting
                                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                                : 'bg-gray-600 text-white hover:bg-gray-700'
                              }`}
                            title={isPredicting ? 'Pause emotion detection' : 'Resume emotion detection'}
                          >
                            {isPredicting ? '⏸ Pause Detection' : '▶ Resume Detection'}
                          </button>
                          <button
                            onClick={toggleVideoRecording}
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
                <div className="border-2 border-indigo-200 bg-indigo-50/50 rounded-lg p-4 sm:p-6">
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
                        {entryType === 'voice' &&
                          (isRecording
                            ? 'Recording… tap Stop & analyze when finished'
                            : 'Record, then stop — we analyze your voice with the audio model')}
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

                      {/* Emotion Timeline */}
                      {emotionHistory.length > 1 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              Timeline
                            </span>
                            <span className="text-xs text-neutral-500">{emotionHistory.length} readings</span>
                          </div>
                          <div className="max-h-44 overflow-y-auto space-y-1">
                            {[...emotionHistory].reverse().map((entry, idx) => {
                              const elapsed = Math.max(0, Math.round((entry.timestamp - recordingStartRef.current) / 1000))
                              const m = Math.floor(elapsed / 60)
                              const s = elapsed % 60
                              return (
                                <div key={idx} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md bg-white border border-neutral-100">
                                  <span className="text-neutral-400 font-mono tabular-nums w-8 shrink-0">{m}:{s.toString().padStart(2, '0')}</span>
                                  <span className="shrink-0">{getEmoji(entry.emotion)}</span>
                                  <span className="capitalize font-medium truncate">{entry.emotion}</span>
                                  <span className="ml-auto font-bold tabular-nums shrink-0" style={{ color: EMOTION_COLORS[entry.emotion] }}>{entry.confidence}%</span>
                                </div>
                              )
                            })}
                          </div>
                          {sessionSummary && (
                            <div className="mt-2 p-2.5 bg-indigo-100/60 rounded-lg text-xs flex items-center gap-2">
                              <span className="text-indigo-600 font-medium">Dominant:</span>
                              <span className="font-bold capitalize">{sessionSummary.dominant} {getEmoji(sessionSummary.dominant)}</span>
                              <span className="text-indigo-500 ml-auto">{sessionSummary.dominantPct}% of readings</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Model Info */}
                      <div className="pt-4 border-t border-indigo-200">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-indigo-700">
                            <Zap className="w-3.5 h-3.5" />
                            <span className="font-medium">{liveEmotion.processingTime}ms</span>
                          </span>
                          <span className="text-indigo-600 font-medium">
                            {entryType === 'text' && 'Text ML v2.1'}
                            {entryType === 'voice' && 'Audio (Wav2Vec2)'}
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
                View Recommendations
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

