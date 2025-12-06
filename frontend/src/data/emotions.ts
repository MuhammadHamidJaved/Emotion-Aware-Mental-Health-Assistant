import { Emotion, EmotionType } from '@/types'

export const EMOTIONS: Record<EmotionType, Emotion> = {
  happy: { type: 'happy', label: 'Happy', emoji: '😊', color: '#10B981' },
  sad: { type: 'sad', label: 'Sad', emoji: '😢', color: '#6B7280' },
  angry: { type: 'angry', label: 'Angry', emoji: '😠', color: '#EF4444' },
  anxious: { type: 'anxious', label: 'Anxious', emoji: '😰', color: '#F59E0B' },
  neutral: { type: 'neutral', label: 'Neutral', emoji: '😐', color: '#9CA3AF' },
  surprised: { type: 'surprised', label: 'Surprised', emoji: '😲', color: '#8B5CF6' },
  disgusted: { type: 'disgusted', label: 'Disgusted', emoji: '🤢', color: '#84CC16' },
  fearful: { type: 'fearful', label: 'Fearful', emoji: '😨', color: '#6366F1' },
  excited: { type: 'excited', label: 'Excited', emoji: '🎉', color: '#EC4899' },
  loved: { type: 'loved', label: 'Loved', emoji: '😍', color: '#F43F5E' },
  tired: { type: 'tired', label: 'Tired', emoji: '😴', color: '#64748B' },
  frustrated: { type: 'frustrated', label: 'Frustrated', emoji: '😤', color: '#DC2626' },
  confident: { type: 'confident', label: 'Confident', emoji: '😎', color: '#3B82F6' },
  disappointed: { type: 'disappointed', label: 'Disappointed', emoji: '😔', color: '#71717A' },
  calm: { type: 'calm', label: 'Calm', emoji: '😌', color: '#14b8a6' },
  energetic: { type: 'energetic', label: 'Energetic', emoji: '⚡', color: '#facc15' },
}

export const EMOTION_LIST: Emotion[] = Object.values(EMOTIONS)

export function getEmotionByType(type: EmotionType): Emotion {
  return EMOTIONS[type]
}

export function getRandomEmotion(): Emotion {
  const emotions = Object.values(EMOTIONS)
  return emotions[Math.floor(Math.random() * emotions.length)]
}

export function getEmotionColor(type: EmotionType): string {
  return EMOTIONS[type]?.color || '#6B7280'
}

export function getEmotionEmoji(type: EmotionType): string {
  return EMOTIONS[type]?.emoji || '😐'
}
