'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Dumbbell, Play, Check, Clock, Target, TrendingUp, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { apiGetPersonalizedRecommendations, apiSendRecommendationFeedback, apiGetRecommendationSettings, type ExerciseRecommendation, type RecommendationSettings } from '@/lib/api';

interface Exercise {
  id: string;
  name: string;
  category: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  benefits: string[];
  steps: string[];
  calories: number;
  icon: string;
  isPersonalized?: boolean;
}

// Fallback exercises when microservice is unavailable
const FALLBACK_EXERCISES: Exercise[] = [
  {
    id: '1', name: 'Morning Yoga Flow', category: 'Yoga', duration: '15 min', difficulty: 'Beginner',
    benefits: ['Reduces stress', 'Improves flexibility', 'Boosts energy'],
    steps: ['Start in mountain pose, feet hip-width apart', 'Inhale, raise arms overhead in upward salute', 'Exhale, fold forward into standing forward bend', 'Inhale, lift halfway up, lengthen spine', 'Exhale, step back to downward-facing dog', 'Hold for 5 breaths, focusing on alignment', 'Walk feet forward, roll up to standing', 'Repeat 3-5 times'],
    calories: 80, icon: '🧘',
  },
  {
    id: '2', name: 'Mindful Walking', category: 'Cardio', duration: '20 min', difficulty: 'Beginner',
    benefits: ['Clears mind', 'Improves mood', 'Gentle exercise'],
    steps: ['Find a quiet walking path or park', 'Start walking at a comfortable pace', 'Focus on the sensation of your feet touching the ground', 'Notice your breathing rhythm', 'Observe your surroundings without judgment', 'If your mind wanders, gently bring attention back to walking', 'Maintain this mindful awareness for full duration', 'End with 5 deep breaths in standing position'],
    calories: 100, icon: '🚶',
  },
  {
    id: '3', name: 'Breathing Exercises', category: 'Meditation', duration: '10 min', difficulty: 'Beginner',
    benefits: ['Reduces anxiety', 'Lowers heart rate', 'Improves focus'],
    steps: ['Sit comfortably with straight spine', 'Close your eyes or soften your gaze', 'Breathe in slowly through nose for 4 counts', 'Hold breath for 4 counts', 'Exhale slowly through mouth for 6 counts', 'Pause for 2 counts before next breath', 'Repeat this cycle 10 times', 'Return to natural breathing, notice how you feel'],
    calories: 20, icon: '🌬️',
  },
  {
    id: '4', name: 'Strength Training', category: 'Strength', duration: '30 min', difficulty: 'Intermediate',
    benefits: ['Builds muscle', 'Boosts metabolism', 'Releases endorphins'],
    steps: ['Warm up with 5 minutes of light cardio', 'Push-ups: 3 sets of 10-15 reps', 'Squats: 3 sets of 15-20 reps', 'Lunges: 3 sets of 10 reps per leg', 'Plank hold: 3 sets of 30-60 seconds', 'Rest 60 seconds between sets', 'Cool down with gentle stretching', 'Hydrate and rest'],
    calories: 200, icon: '💪',
  },
  {
    id: '5', name: 'Dance Therapy', category: 'Cardio', duration: '25 min', difficulty: 'Beginner',
    benefits: ['Boosts mood', 'Fun exercise', 'Stress relief'],
    steps: ['Put on your favorite upbeat music', 'Start with gentle swaying to warm up', 'Let your body move freely to the rhythm', 'Try different movements: arms, legs, whole body', 'Don\'t worry about technique, just enjoy', 'Increase energy in the middle section', 'Slow down gradually toward the end', 'Finish with stretching and deep breaths'],
    calories: 180, icon: '💃',
  },
  {
    id: '6', name: 'Tai Chi Basics', category: 'Yoga', duration: '20 min', difficulty: 'Beginner',
    benefits: ['Improves balance', 'Reduces stress', 'Gentle movement'],
    steps: ['Stand with feet shoulder-width apart', 'Relax shoulders, soften knees', 'Begin "cloud hands" movement: shift weight side to side', 'Move arms in circular motion, following the body', 'Keep movements slow, smooth, continuous', 'Focus on breathing naturally', 'Practice "parting wild horse\'s mane" movement', 'End in standing meditation for 2 minutes'],
    calories: 90, icon: '🥋',
  },
  {
    id: '7', name: 'HIIT Workout', category: 'Cardio', duration: '20 min', difficulty: 'Advanced',
    benefits: ['Burns calories fast', 'Boosts metabolism', 'Time-efficient'],
    steps: ['Warm up: 3 minutes light jogging', 'Jumping jacks: 45 seconds', 'Rest: 15 seconds', 'Burpees: 45 seconds', 'Rest: 15 seconds', 'Mountain climbers: 45 seconds', 'Rest: 15 seconds', 'Repeat circuit 4 times, cool down'],
    calories: 250, icon: '🔥',
  },
  {
    id: '8', name: 'Progressive Muscle Relaxation', category: 'Meditation', duration: '15 min', difficulty: 'Beginner',
    benefits: ['Releases tension', 'Promotes sleep', 'Reduces anxiety'],
    steps: ['Lie down or sit comfortably', 'Close your eyes, take deep breaths', 'Tense feet muscles for 5 seconds, then release', 'Notice the difference between tension and relaxation', 'Move up to calves, tense and release', 'Continue with thighs, abdomen, arms, shoulders', 'Finish with face and jaw muscles', 'Rest for 2 minutes, feeling fully relaxed'],
    calories: 15, icon: '😌',
  },
];

const CATEGORY_ICONS: Record<string, string> = {
  Yoga: '🧘', Cardio: '🏃', Strength: '💪', Meditation: '🧠',
};

const EMOTION_OPTIONS = [
  { key: 'all', label: 'All', emoji: '🌈' },
  { key: 'happy', label: 'Happy', emoji: '😊' },
  { key: 'calm', label: 'Calm', emoji: '😌' },
  { key: 'sad', label: 'Sad', emoji: '😢' },
  { key: 'anxious', label: 'Anxious', emoji: '😰' },
  { key: 'energetic', label: 'Energetic', emoji: '⚡' },
  { key: 'tired', label: 'Tired', emoji: '😴' },
];

function apiExerciseToExercise(ex: ExerciseRecommendation, idx: number): Exercise {
  // Use the API's difficulty field if available, otherwise infer from category
  let difficulty: Exercise['difficulty'] = 'Beginner';
  const diff = (ex.difficulty || '').toLowerCase();
  if (diff.includes('advanced') || diff.includes('hard')) difficulty = 'Advanced';
  else if (diff.includes('intermediate') || diff.includes('moderate')) difficulty = 'Intermediate';
  else if (diff) difficulty = 'Beginner';
  else {
    // Fallback: infer from category
    const cat = (ex.category || '').toLowerCase();
    if (cat.includes('advanced') || cat.includes('hard')) difficulty = 'Advanced';
    else if (cat.includes('intermediate') || cat.includes('moderate')) difficulty = 'Intermediate';
  }

  return {
    id: `api-${idx}`,
    name: ex.name || 'Exercise',
    category: ex.category || 'General',
    duration: ex.duration || '15 min',
    difficulty,
    benefits: ex.description ? [ex.description] : ['Good for your mood'],
    steps: [],
    calories: 50,
    icon: ex.icon || CATEGORY_ICONS[ex.category] || '🏃',
    isPersonalized: true,
  };
}

export default function ExercisesPage() {
  const searchParams = useSearchParams();
  const urlEmotion = searchParams?.get('emotion') || null;

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedEmotion, setSelectedEmotion] = useState<string>(urlEmotion || 'all');
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [apiExercises, setApiExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>(FALLBACK_EXERCISES);
  const [recommendationId, setRecommendationId] = useState<string>('');
  const [userPrefs, setUserPrefs] = useState<Partial<RecommendationSettings>>({});

  // Load saved user preferences so fitness_level is forwarded to the microservice.
  useEffect(() => {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!accessToken) return;
    apiGetRecommendationSettings(accessToken)
      .then(prefs => setUserPrefs(prefs))
      .catch(() => {});
  }, []);

  const categories = ['All', 'Yoga', 'Cardio', 'Strength', 'Meditation'];

  const fetchPersonalizedExercises = useCallback(async (emotion: string) => {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!accessToken) {
      setUsingFallback(true);
      setAllExercises(FALLBACK_EXERCISES);
      return;
    }

    setIsLoading(true);
    setUsingFallback(false);

    try {
      const data = await apiGetPersonalizedRecommendations(accessToken, {
        emotion: emotion === 'all' ? 'neutral' : emotion,
        types: ['exercise'],
        preferences: {
          fitness_level: userPrefs.fitness_level,
          age_group: userPrefs.age_group,
        },
      });

      const exerciseData = data.recommendations?.exercise;
      if (exerciseData && Array.isArray(exerciseData) && exerciseData.length > 0) {
        const exercises = exerciseData.map((ex, idx) => apiExerciseToExercise(ex, idx));
        setApiExercises(exercises);
        setRecommendationId(data.recommendation_id || '');
        // Merge: API exercises first, then fallback
        setAllExercises([...exercises, ...FALLBACK_EXERCISES]);
      } else {
        setUsingFallback(true);
        setAllExercises(FALLBACK_EXERCISES);
      }
    } catch (err) {
      console.error('Failed to fetch personalized exercises:', err);
      setUsingFallback(true);
      setAllExercises(FALLBACK_EXERCISES);
    } finally {
      setIsLoading(false);
    }
  }, [userPrefs]);

  useEffect(() => {
    fetchPersonalizedExercises(selectedEmotion);
  }, [selectedEmotion, fetchPersonalizedExercises]);

  const filteredExercises = selectedCategory === 'All'
    ? allExercises
    : allExercises.filter(ex => ex.category === selectedCategory);

  const toggleComplete = (id: string) => {
    const wasCompleted = completedExercises.includes(id);
    setCompletedExercises(prev =>
      prev.includes(id)
        ? prev.filter(eid => eid !== id)
        : [...prev, id]
    );

    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (accessToken && id.startsWith('api-')) {
      apiSendRecommendationFeedback(accessToken, {
        recommendation_id: recommendationId,
        item_id: id,
        feedback_type: wasCompleted ? 'skip' : 'complete',
        recommendation_type: 'exercise',
      }).catch(() => {});
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-700';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'Advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const totalCaloriesBurned = completedExercises.reduce((sum, id) => {
    const exercise = allExercises.find(ex => ex.id === id);
    return sum + (exercise?.calories || 0);
  }, 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-50 text-black -mx-4 sm:-mx-6">
      <div className="bg-white border-b border-neutral-200 px-4 sm:px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 shrink-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-sm">
            <Dumbbell className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-neutral-900 leading-tight">Wellness Exercises</h1>
            <p className="text-xs text-neutral-500 mt-0.5 truncate">
              {usingFallback ? 'Default library · open Settings to personalize' : 'Personalized for your mood'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
        {/* Banners */}
        {usingFallback && !isLoading && (
          <div className="mb-3 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-900 leading-snug sm:text-sm">
            <span className="mr-1">⚠️</span>
            Default exercises.{' '}
            <a href="/settings" className="font-medium underline underline-offset-2">
              Set fitness level
            </a>{' '}
            for AI picks.
          </div>
        )}
        {urlEmotion && !usingFallback && !isLoading && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-indigo-200/80 bg-indigo-50/90 px-3 py-2 text-xs text-indigo-900 sm:text-sm">
            <span>✨</span>
            <span>
              Tailored for <strong className="capitalize">{urlEmotion}</strong> from your check-in.
            </span>
            <a href="/exercises" className="ml-auto shrink-0 text-[11px] font-medium text-indigo-600 hover:underline">
              Clear
            </a>
          </div>
        )}

        {/* Filters — scroll on narrow screens */}
        <div className="mb-4 flex flex-wrap items-center gap-1.5 sm:gap-2">
          {urlEmotion ? (
            <>
              <span className="text-[11px] font-medium text-neutral-500 sm:text-xs">Mood:</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-neutral-900 bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
                <span>{EMOTION_OPTIONS.find(e => e.key === selectedEmotion)?.emoji}</span>
                {EMOTION_OPTIONS.find(e => e.key === selectedEmotion)?.label}
              </span>
              <span className="hidden text-[11px] text-neutral-400 sm:inline sm:text-xs">from check-in</span>
            </>
          ) : (
            <>
              <span className="basis-full text-[11px] font-medium text-neutral-500 sm:basis-auto sm:text-xs">Mood</span>
              {EMOTION_OPTIONS.map((emo) => (
                <button key={emo.key} onClick={() => setSelectedEmotion(emo.key)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium transition-all sm:px-3 sm:py-1.5 sm:text-sm ${
                    selectedEmotion === emo.key ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm' : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                  }`}>
                  <span>{emo.emoji}</span>
                  {emo.label}
                </button>
              ))}
            </>
          )}
          <span className="hidden text-neutral-300 sm:inline" aria-hidden>
            |
          </span>
          <span className="basis-full text-[11px] font-medium text-neutral-500 sm:basis-auto sm:text-xs">Category</span>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`rounded-full border px-2 py-1 text-[11px] font-medium transition-all sm:px-3 sm:py-1.5 sm:text-sm ${
                selectedCategory === cat ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm' : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Active preference context */}
        {userPrefs.fitness_level && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500 sm:text-xs">
            <span>Fitness</span>
            <span className="rounded-full bg-orange-100 px-2 py-0.5 font-medium capitalize text-orange-800">{userPrefs.fitness_level}</span>
            <a href="/settings" className="text-neutral-400 hover:text-neutral-700 hover:underline">
              Edit
            </a>
          </div>
        )}

        {/* Main layout — sidebar stacks below on mobile */}
        <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,260px)] lg:gap-5">

          {/* Exercise grid */}
          <div className="order-1 lg:order-none">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-7 h-7 animate-spin text-gray-300 mb-3" />
                <p className="text-sm text-gray-400">Loading personalized exercises…</p>
              </div>
            ) : filteredExercises.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Dumbbell className="w-10 h-10 mb-3 text-gray-200" />
                <p className="text-sm">No exercises for this filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3">
                {filteredExercises.map((exercise) => {
                  const isExpanded = expandedExercise === exercise.id;
                  const isCompleted = completedExercises.includes(exercise.id);
                  const displayName = exercise.name && exercise.name !== 'Exercise'
                    ? exercise.name
                    : exercise.category + (exercise.duration ? ` · ${exercise.duration}` : '');

                  return (
                    <div key={exercise.id}
                      className={`bg-white rounded-2xl border overflow-hidden transition-shadow hover:shadow-sm ${
                        isCompleted ? 'border-green-200' : exercise.isPersonalized ? 'border-indigo-200' : 'border-gray-200'
                      }`}>
                      {/* Card top */}
                      <div className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="text-3xl leading-none mt-0.5">{exercise.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold leading-tight">{displayName}</h3>
                              {exercise.isPersonalized && (
                                <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 leading-none">✨ For You</span>
                              )}
                              {isCompleted && (
                                <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 leading-none flex items-center gap-0.5">
                                  <Check className="w-3 h-3" />Done
                                </span>
                              )}
                            </div>
                            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-1">
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getDifficultyColor(exercise.difficulty)}`}>{exercise.difficulty}</span>
                              <span className="flex items-center gap-0.5 text-xs text-gray-500"><Clock className="w-3 h-3" />{exercise.duration}</span>
                              <span className="flex items-center gap-0.5 text-xs text-gray-500"><TrendingUp className="w-3 h-3" />{exercise.calories} cal</span>
                            </div>
                          </div>
                        </div>

                        {/* Benefits chips */}
                        {exercise.benefits.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {exercise.benefits.slice(0, 3).map((b, i) => (
                              <span key={i} className="text-xs bg-gray-50 border border-gray-100 text-gray-600 px-2 py-0.5 rounded-full">✓ {b}</span>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          {exercise.steps.length > 0 && (
                            <button onClick={() => setExpandedExercise(isExpanded ? null : exercise.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-xs font-medium">
                              <Play className="w-3 h-3" />{isExpanded ? 'Hide' : 'Steps'}
                            </button>
                          )}
                          <button onClick={() => toggleComplete(exercise.id)}
                            className={`flex-1 px-3 py-1.5 rounded-lg transition-colors text-xs font-medium border ${
                              isCompleted ? 'border-green-400 text-green-700 bg-green-50' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}>
                            {isCompleted ? 'Completed ✓' : 'Mark Complete'}
                          </button>
                        </div>
                      </div>

                      {/* Expanded steps */}
                      {isExpanded && exercise.steps.length > 0 && (
                        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Steps</p>
                          <ol className="space-y-2">
                            {exercise.steps.map((step, idx) => (
                              <li key={idx} className="flex gap-2">
                                <span className="flex-shrink-0 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">{idx + 1}</span>
                                <span className="text-xs text-gray-700 leading-relaxed">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="order-2 space-y-3 lg:sticky lg:top-20 lg:order-none lg:self-start">
            {/* Progress card */}
            <div className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-4">
              <h3 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                <Target className="h-3.5 w-3.5" /> Today
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-500">Exercises done</span>
                    <span className="font-bold">{completedExercises.length} / 3</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${Math.min((completedExercises.length / 3) * 100, 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-500">Calories</span>
                    <span className="font-bold">{totalCaloriesBurned} / 300</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full transition-all"
                      style={{ width: `${Math.min((totalCaloriesBurned / 300) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats card */}
            <div className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-4">
              <h3 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                <CalendarIcon className="h-3.5 w-3.5" /> Library
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Personalized', value: `${apiExercises.length} ex` },
                  { label: 'Default', value: `${FALLBACK_EXERCISES.length} ex` },
                  { label: 'Showing', value: `${filteredExercises.length} ex` },
                  { label: 'Mode', value: usingFallback ? 'Default' : 'AI' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{s.label}</span>
                    <span className="text-xs font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-xl border border-sky-200/80 bg-sky-50/90 p-3 sm:p-4">
              <h3 className="mb-2 text-xs font-semibold text-sky-900">💡 Tips</h3>
              <ul className="space-y-1.5 text-xs text-blue-700">
                {['Start slow, build up gradually', 'Stay hydrated throughout', 'Rest when your body asks', 'Consistency beats intensity'].map(t => (
                  <li key={t} className="flex items-start gap-1.5"><span className="mt-0.5">•</span>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
