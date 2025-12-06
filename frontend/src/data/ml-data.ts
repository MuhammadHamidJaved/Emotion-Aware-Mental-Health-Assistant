import { MLModel, EmotionPrediction, ModelPerformance, RealTimeDetection, EmotionType } from '@/types'

// ML Models
export const ML_MODELS: MLModel[] = [
  {
    id: '1',
    name: 'Text Emotion Classifier',
    version: 'v2.1.0',
    type: 'text',
    status: 'active',
    accuracy: 0.947,
    lastTrained: '2025-10-05T10:30:00Z',
    totalPredictions: 15847
  },
  {
    id: '2',
    name: 'Voice Sentiment Analyzer',
    version: 'v1.8.3',
    type: 'voice',
    status: 'active',
    accuracy: 0.892,
    lastTrained: '2025-10-03T14:20:00Z',
    totalPredictions: 8923
  },
  {
    id: '3',
    name: 'Facial Expression Recognition',
    version: 'v3.0.1',
    type: 'video',
    status: 'active',
    accuracy: 0.934,
    lastTrained: '2025-10-08T09:15:00Z',
    totalPredictions: 12456
  },
  {
    id: '4',
    name: 'Multimodal Fusion Network',
    version: 'v1.2.0',
    type: 'multimodal',
    status: 'training',
    accuracy: 0.961,
    lastTrained: '2025-10-09T16:45:00Z',
    totalPredictions: 5234
  }
]

// Real-time Detection Simulation
export const SAMPLE_REAL_TIME_DETECTION: RealTimeDetection = {
  isProcessing: false,
  predictions: [
    { emotion: 'happy', confidence: 0.87, timestamp: '2025-10-10T10:30:15Z' },
    { emotion: 'calm', confidence: 0.76, timestamp: '2025-10-10T10:30:16Z' },
    { emotion: 'confident', confidence: 0.65, timestamp: '2025-10-10T10:30:17Z' },
    { emotion: 'neutral', confidence: 0.45, timestamp: '2025-10-10T10:30:18Z' }
  ],
  dominantEmotion: 'happy',
  confidence: 0.87,
  modalityUsed: 'text'
}

// Model Performance Metrics
export const TEXT_MODEL_PERFORMANCE: ModelPerformance = {
  accuracy: 0.947,
  precision: 0.951,
  recall: 0.943,
  f1Score: 0.947,
  classLabels: ['happy', 'sad', 'angry', 'anxious', 'neutral', 'calm', 'confident', 'tired'],
  confusionMatrix: [
    [245, 3, 1, 2, 5, 2, 1, 1], // happy
    [2, 198, 4, 8, 3, 1, 2, 2], // sad
    [1, 3, 187, 5, 2, 1, 1, 0], // angry
    [3, 12, 4, 176, 3, 1, 1, 0], // anxious
    [4, 2, 1, 2, 231, 8, 2, 0], // neutral
    [2, 1, 0, 1, 6, 210, 4, 1], // calm
    [1, 2, 1, 0, 3, 5, 208, 0], // confident
    [0, 3, 0, 1, 1, 2, 1, 192] // tired
  ]
}

export const VOICE_MODEL_PERFORMANCE: ModelPerformance = {
  accuracy: 0.892,
  precision: 0.898,
  recall: 0.886,
  f1Score: 0.892,
  classLabels: ['happy', 'sad', 'angry', 'anxious', 'neutral', 'calm'],
  confusionMatrix: [
    [189, 5, 2, 3, 8, 3], // happy
    [4, 172, 6, 10, 5, 3], // sad
    [3, 7, 165, 8, 4, 3], // angry
    [5, 14, 6, 158, 6, 1], // anxious
    [7, 4, 3, 5, 195, 6], // neutral
    [3, 2, 1, 2, 8, 184]  // calm
  ]
}

export const VIDEO_MODEL_PERFORMANCE: ModelPerformance = {
  accuracy: 0.934,
  precision: 0.938,
  recall: 0.930,
  f1Score: 0.934,
  classLabels: ['happy', 'sad', 'angry', 'surprised', 'neutral', 'disgusted', 'fearful'],
  confusionMatrix: [
    [223, 4, 2, 5, 6, 1, 2], // happy
    [3, 201, 5, 2, 7, 1, 3], // sad
    [2, 6, 188, 1, 4, 2, 0], // angry
    [7, 1, 0, 196, 8, 2, 1], // surprised
    [5, 6, 3, 7, 218, 3, 1], // neutral
    [1, 2, 4, 1, 5, 178, 2], // disgusted
    [2, 4, 1, 2, 3, 1, 187] // fearful
  ]
}

// Training History
export const TRAINING_HISTORY = {
  textModel: [
    { epoch: 1, trainLoss: 0.89, valLoss: 0.92, trainAcc: 0.72, valAcc: 0.69 },
    { epoch: 2, trainLoss: 0.65, valLoss: 0.71, trainAcc: 0.81, valAcc: 0.77 },
    { epoch: 3, trainLoss: 0.52, valLoss: 0.58, trainAcc: 0.87, valAcc: 0.83 },
    { epoch: 4, trainLoss: 0.43, valLoss: 0.49, trainAcc: 0.90, valAcc: 0.87 },
    { epoch: 5, trainLoss: 0.37, valLoss: 0.44, trainAcc: 0.92, valAcc: 0.89 },
    { epoch: 6, trainLoss: 0.32, valLoss: 0.41, trainAcc: 0.94, valAcc: 0.91 },
    { epoch: 7, trainLoss: 0.28, valLoss: 0.39, trainAcc: 0.95, valAcc: 0.92 },
    { epoch: 8, trainLoss: 0.25, valLoss: 0.38, trainAcc: 0.96, valAcc: 0.93 },
    { epoch: 9, trainLoss: 0.23, valLoss: 0.37, trainAcc: 0.96, valAcc: 0.94 },
    { epoch: 10, trainLoss: 0.21, valLoss: 0.36, trainAcc: 0.97, valAcc: 0.95 }
  ],
  voiceModel: [
    { epoch: 1, trainLoss: 0.95, valLoss: 0.98, trainAcc: 0.68, valAcc: 0.65 },
    { epoch: 2, trainLoss: 0.71, valLoss: 0.76, trainAcc: 0.78, valAcc: 0.74 },
    { epoch: 3, trainLoss: 0.58, valLoss: 0.64, trainAcc: 0.84, valAcc: 0.80 },
    { epoch: 4, trainLoss: 0.49, valLoss: 0.56, trainAcc: 0.88, valAcc: 0.84 },
    { epoch: 5, trainLoss: 0.42, valLoss: 0.51, trainAcc: 0.90, valAcc: 0.86 },
    { epoch: 6, trainLoss: 0.37, valLoss: 0.48, trainAcc: 0.92, valAcc: 0.88 },
    { epoch: 7, trainLoss: 0.33, valLoss: 0.46, trainAcc: 0.93, valAcc: 0.89 },
    { epoch: 8, trainLoss: 0.30, valLoss: 0.45, trainAcc: 0.94, valAcc: 0.89 }
  ]
}

// Emotion Detection Results (for journal entries)
export const EMOTION_DETECTIONS = [
  {
    id: '1',
    entryId: '1',
    modality: 'text' as const,
    emotions: {
      happy: 0.87,
      calm: 0.76,
      confident: 0.65,
      neutral: 0.45,
      anxious: 0.23,
      sad: 0.12
    },
    dominantEmotion: 'happy' as EmotionType,
    valence: 0.72,
    arousal: 0.68,
    confidence: 0.87,
    detectedAt: '2025-10-10T10:30:00Z',
    modelVersion: 'v2.1.0',
    processingTime: 234
  },
  {
    id: '2',
    entryId: '2',
    modality: 'voice' as const,
    emotions: {
      anxious: 0.82,
      sad: 0.71,
      neutral: 0.54,
      tired: 0.48,
      calm: 0.31
    },
    dominantEmotion: 'anxious' as EmotionType,
    valence: -0.45,
    arousal: 0.72,
    confidence: 0.82,
    detectedAt: '2025-10-09T15:20:00Z',
    modelVersion: 'v1.8.3',
    processingTime: 456
  },
  {
    id: '3',
    entryId: '3',
    modality: 'facial' as const,
    emotions: {
      sad: 0.91,
      tired: 0.78,
      neutral: 0.43,
      anxious: 0.39
    },
    dominantEmotion: 'sad' as EmotionType,
    valence: -0.68,
    arousal: 0.42,
    confidence: 0.91,
    detectedAt: '2025-10-08T20:15:00Z',
    modelVersion: 'v3.0.1',
    processingTime: 312
  }
]

// Mood History for Charts (7 days)
export const MOOD_HISTORY = [
  { date: '2025-10-04', dominantMood: 'calm', avgValence: 0.45, avgArousal: 0.52, entriesCount: 3 },
  { date: '2025-10-05', dominantMood: 'happy', avgValence: 0.68, avgArousal: 0.71, entriesCount: 5 },
  { date: '2025-10-06', dominantMood: 'neutral', avgValence: 0.12, avgArousal: 0.48, entriesCount: 2 },
  { date: '2025-10-07', dominantMood: 'anxious', avgValence: -0.34, avgArousal: 0.78, entriesCount: 4 },
  { date: '2025-10-08', dominantMood: 'sad', avgValence: -0.52, avgArousal: 0.45, entriesCount: 3 },
  { date: '2025-10-09', dominantMood: 'calm', avgValence: 0.38, avgArousal: 0.41, entriesCount: 6 },
  { date: '2025-10-10', dominantMood: 'happy', avgValence: 0.72, avgArousal: 0.65, entriesCount: 4 }
]

// Hourly Emotion Patterns (24 hours)
export const HOURLY_EMOTION_PATTERNS = [
  { hour: 0, happy: 2, sad: 1, anxious: 0, calm: 3, neutral: 1 },
  { hour: 1, happy: 1, sad: 0, anxious: 1, calm: 2, neutral: 0 },
  { hour: 6, happy: 5, sad: 2, anxious: 3, calm: 4, neutral: 2 },
  { hour: 7, happy: 8, sad: 1, anxious: 2, calm: 6, neutral: 3 },
  { hour: 8, happy: 12, sad: 3, anxious: 5, calm: 8, neutral: 4 },
  { hour: 9, happy: 15, sad: 2, anxious: 4, calm: 10, neutral: 5 },
  { hour: 10, happy: 18, sad: 3, anxious: 3, calm: 12, neutral: 6 },
  { hour: 11, happy: 16, sad: 4, anxious: 6, calm: 11, neutral: 7 },
  { hour: 12, happy: 14, sad: 3, anxious: 5, calm: 13, neutral: 8 },
  { hour: 13, happy: 12, sad: 5, anxious: 7, calm: 10, neutral: 6 },
  { hour: 14, happy: 10, sad: 6, anxious: 8, calm: 9, neutral: 7 },
  { hour: 15, happy: 8, sad: 7, anxious: 9, calm: 7, neutral: 6 },
  { hour: 16, happy: 7, sad: 8, anxious: 10, calm: 6, neutral: 5 },
  { hour: 17, happy: 9, sad: 6, anxious: 8, calm: 8, neutral: 4 },
  { hour: 18, happy: 11, sad: 5, anxious: 6, calm: 10, neutral: 5 },
  { hour: 19, happy: 13, sad: 4, anxious: 4, calm: 12, neutral: 6 },
  { hour: 20, happy: 10, sad: 3, anxious: 3, calm: 14, neutral: 5 },
  { hour: 21, happy: 8, sad: 2, anxious: 2, calm: 16, neutral: 4 },
  { hour: 22, happy: 6, sad: 3, anxious: 3, calm: 12, neutral: 3 },
  { hour: 23, happy: 4, sad: 2, anxious: 2, calm: 8, neutral: 2 }
]

// Emotion Distribution (overall)
export const EMOTION_DISTRIBUTION = [
  { emotion: 'happy', count: 487 },
  { emotion: 'calm', count: 523 },
  { emotion: 'anxious', count: 312 },
  { emotion: 'confident', count: 267 },
  { emotion: 'sad', count: 234 },
  { emotion: 'tired', count: 189 },
  { emotion: 'excited', count: 156 },
  { emotion: 'angry', count: 145 },
  { emotion: 'energetic', count: 134 },
  { emotion: 'frustrated', count: 123 },
  { emotion: 'surprised', count: 112 },
  { emotion: 'loved', count: 98 },
  { emotion: 'disappointed', count: 87 },
  { emotion: 'fearful', count: 76 },
  { emotion: 'disgusted', count: 54 }
]
