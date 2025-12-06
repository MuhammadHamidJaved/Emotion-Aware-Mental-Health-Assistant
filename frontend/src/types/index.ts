// User types
export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  profilePicture?: string
  dateOfBirth?: string
  bio?: string
  mentalHealthConcerns: string[]
  journalingGoals: string[]
  totalEntries: number
  currentStreak: number
  longestStreak: number
  createdAt: string
}

// Emotion types
export type EmotionType = 'happy' | 'sad' | 'angry' | 'anxious' | 'neutral' | 'surprised' | 'disgusted' | 'fearful' | 'excited' | 'loved' | 'tired' | 'frustrated' | 'confident' | 'disappointed' | 'calm' | 'energetic'

export interface Emotion {
  type: EmotionType
  label: string
  emoji: string
  score?: number
  color?: string
}

export interface EmotionDetection {
  id: string
  entryId: string
  modality: 'text' | 'voice' | 'facial' | 'fused'
  emotions: Record<string, number>
  dominantEmotion: EmotionType
  valence: number // -1 to 1
  arousal: number  // 0 to 1
  confidence: number
  detectedAt: string
  modelVersion?: string
  processingTime?: number // milliseconds
}

// ML Model types
export interface MLModel {
  id: string
  name: string
  version: string
  type: 'text' | 'voice' | 'video' | 'multimodal'
  status: 'active' | 'training' | 'inactive'
  accuracy: number
  lastTrained: string
  totalPredictions: number
}

export interface EmotionPrediction {
  emotion: EmotionType
  confidence: number
  timestamp: string
}

export interface ModelPerformance {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  confusionMatrix: number[][]
  classLabels: string[]
}

export interface RealTimeDetection {
  isProcessing: boolean
  predictions: EmotionPrediction[]
  dominantEmotion?: EmotionType
  confidence?: number
  modalityUsed: 'text' | 'voice' | 'video' | 'multimodal'
}

// User Preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto' | 'mood-adaptive'
  dataStorage: 'cloud' | 'local' | 'hybrid'
  cloudSyncEnabled: boolean
  locationEnabled: boolean
  notificationsEnabled: boolean
  biometricEnabled: boolean
  emotionDetectionEnabled: boolean
  voiceDetectionEnabled: boolean
  videoDetectionEnabled: boolean
  shareAnonymousData: boolean
}

// Journal Entry types
export type EntryType = 'text' | 'voice' | 'video'
export type PrivacySetting = 'private' | 'therapist'

export interface JournalEntry {
  id: string
  userId: string
  type: EntryType
  title?: string
  content?: string
  voiceFile?: string
  videoFile?: string
  transcription?: string
  wordCount: number
  duration?: number
  privacy: PrivacySetting
  location?: {
    name: string
    latitude: number
    longitude: number
  }
  emotions: Emotion[]
  tags: Tag[]
  mediaFiles: string[]
  entryDate: string
  createdAt: string
  updatedAt: string
  isFavorite: boolean
  isDraft: boolean
}

// Tag types
export interface Tag {
  id: string
  name: string
  color: string
  usageCount: number
}

// Mood Check-in types
export interface MoodCheckIn {
  id: string
  userId: string
  mood: EmotionType
  intensity: number // 1-10
  note?: string
  checkedInAt: string
}

// Recommendation types
export type RecommendationCategory = 'exercise' | 'music' | 'article' | 'video' | 'meditation'

export interface Recommendation {
  id: string
  title: string
  description: string
  category: RecommendationCategory
  contentUrl?: string
  thumbnailUrl?: string
  duration: number // minutes
  targetEmotions: EmotionType[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  rating?: number
  isCompleted?: boolean
  timesCompleted?: number
  isBookmarked?: boolean
}

// AI Chat types
export interface ChatMessage {
  id: string
  sender: 'user' | 'ai'
  message: string
  entryReference?: string
  emotionContext?: Record<string, any>
  createdAt: string
}

// Analytics types
export interface EmotionAnalytics {
  emotionDistribution: Record<EmotionType, number>
  weeklyPattern: Array<{
    day: string
    value: number
  }>
  timeOfDayPattern: Array<{
    hour: number
    value: number
  }>
  moodTrend: 'improving' | 'declining' | 'stable'
  dominantEmotion: EmotionType
  averageMood: number
}

export interface JournalingStats {
  totalEntries: number
  currentStreak: number
  longestStreak: number
  averageWordCount: number
  preferredType: EntryType
  totalTime: number // minutes
  entriesThisWeek: number
  entriesThisMonth: number
}
