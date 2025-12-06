'use client';

import { useState } from 'react';
import { Dumbbell, Play, Check, Clock, Target, TrendingUp, Calendar as CalendarIcon } from 'lucide-react';

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
}

const EXERCISES: Exercise[] = [
  {
    id: '1',
    name: 'Morning Yoga Flow',
    category: 'Yoga',
    duration: '15 min',
    difficulty: 'Beginner',
    benefits: ['Reduces stress', 'Improves flexibility', 'Boosts energy'],
    steps: [
      'Start in mountain pose, feet hip-width apart',
      'Inhale, raise arms overhead in upward salute',
      'Exhale, fold forward into standing forward bend',
      'Inhale, lift halfway up, lengthen spine',
      'Exhale, step back to downward-facing dog',
      'Hold for 5 breaths, focusing on alignment',
      'Walk feet forward, roll up to standing',
      'Repeat 3-5 times'
    ],
    calories: 80,
    icon: '🧘',
  },
  {
    id: '2',
    name: 'Mindful Walking',
    category: 'Cardio',
    duration: '20 min',
    difficulty: 'Beginner',
    benefits: ['Clears mind', 'Improves mood', 'Gentle exercise'],
    steps: [
      'Find a quiet walking path or park',
      'Start walking at a comfortable pace',
      'Focus on the sensation of your feet touching the ground',
      'Notice your breathing rhythm',
      'Observe your surroundings without judgment',
      'If your mind wanders, gently bring attention back to walking',
      'Maintain this mindful awareness for full duration',
      'End with 5 deep breaths in standing position'
    ],
    calories: 100,
    icon: '🚶',
  },
  {
    id: '3',
    name: 'Breathing Exercises',
    category: 'Meditation',
    duration: '10 min',
    difficulty: 'Beginner',
    benefits: ['Reduces anxiety', 'Lowers heart rate', 'Improves focus'],
    steps: [
      'Sit comfortably with straight spine',
      'Close your eyes or soften your gaze',
      'Breathe in slowly through nose for 4 counts',
      'Hold breath for 4 counts',
      'Exhale slowly through mouth for 6 counts',
      'Pause for 2 counts before next breath',
      'Repeat this cycle 10 times',
      'Return to natural breathing, notice how you feel'
    ],
    calories: 20,
    icon: '🌬️',
  },
  {
    id: '4',
    name: 'Strength Training',
    category: 'Strength',
    duration: '30 min',
    difficulty: 'Intermediate',
    benefits: ['Builds muscle', 'Boosts metabolism', 'Releases endorphins'],
    steps: [
      'Warm up with 5 minutes of light cardio',
      'Push-ups: 3 sets of 10-15 reps',
      'Squats: 3 sets of 15-20 reps',
      'Lunges: 3 sets of 10 reps per leg',
      'Plank hold: 3 sets of 30-60 seconds',
      'Rest 60 seconds between sets',
      'Cool down with gentle stretching',
      'Hydrate and rest'
    ],
    calories: 200,
    icon: '💪',
  },
  {
    id: '5',
    name: 'Dance Therapy',
    category: 'Cardio',
    duration: '25 min',
    difficulty: 'Beginner',
    benefits: ['Boosts mood', 'Fun exercise', 'Stress relief'],
    steps: [
      'Put on your favorite upbeat music',
      'Start with gentle swaying to warm up',
      'Let your body move freely to the rhythm',
      'Try different movements: arms, legs, whole body',
      'Don\'t worry about technique, just enjoy',
      'Increase energy in the middle section',
      'Slow down gradually toward the end',
      'Finish with stretching and deep breaths'
    ],
    calories: 180,
    icon: '💃',
  },
  {
    id: '6',
    name: 'Tai Chi Basics',
    category: 'Yoga',
    duration: '20 min',
    difficulty: 'Beginner',
    benefits: ['Improves balance', 'Reduces stress', 'Gentle movement'],
    steps: [
      'Stand with feet shoulder-width apart',
      'Relax shoulders, soften knees',
      'Begin "cloud hands" movement: shift weight side to side',
      'Move arms in circular motion, following the body',
      'Keep movements slow, smooth, continuous',
      'Focus on breathing naturally',
      'Practice "parting wild horse\'s mane" movement',
      'End in standing meditation for 2 minutes'
    ],
    calories: 90,
    icon: '🥋',
  },
  {
    id: '7',
    name: 'HIIT Workout',
    category: 'Cardio',
    duration: '20 min',
    difficulty: 'Advanced',
    benefits: ['Burns calories fast', 'Boosts metabolism', 'Time-efficient'],
    steps: [
      'Warm up: 3 minutes light jogging',
      'Jumping jacks: 45 seconds',
      'Rest: 15 seconds',
      'Burpees: 45 seconds',
      'Rest: 15 seconds',
      'Mountain climbers: 45 seconds',
      'Rest: 15 seconds',
      'Repeat circuit 4 times, cool down'
    ],
    calories: 250,
    icon: '🔥',
  },
  {
    id: '8',
    name: 'Progressive Muscle Relaxation',
    category: 'Meditation',
    duration: '15 min',
    difficulty: 'Beginner',
    benefits: ['Releases tension', 'Promotes sleep', 'Reduces anxiety'],
    steps: [
      'Lie down or sit comfortably',
      'Close your eyes, take deep breaths',
      'Tense feet muscles for 5 seconds, then release',
      'Notice the difference between tension and relaxation',
      'Move up to calves, tense and release',
      'Continue with thighs, abdomen, arms, shoulders',
      'Finish with face and jaw muscles',
      'Rest for 2 minutes, feeling fully relaxed'
    ],
    calories: 15,
    icon: '😌',
  },
];

export default function ExercisesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  const categories = ['All', 'Yoga', 'Cardio', 'Strength', 'Meditation'];

  const filteredExercises = selectedCategory === 'All'
    ? EXERCISES
    : EXERCISES.filter(ex => ex.category === selectedCategory);

  const toggleComplete = (id: string) => {
    setCompletedExercises(prev =>
      prev.includes(id)
        ? prev.filter(eid => eid !== id)
        : [...prev, id]
    );
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
    const exercise = EXERCISES.find(ex => ex.id === id);
    return sum + (exercise?.calories || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Wellness Exercises</h1>
              <p className="text-gray-600">Physical activities to improve mental health</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedCategory === category
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Exercise List */}
            <div className="space-y-4">
              {filteredExercises.map((exercise) => {
                const isExpanded = expandedExercise === exercise.id;
                const isCompleted = completedExercises.includes(exercise.id);

                return (
                  <div
                    key={exercise.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Exercise Header */}
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="text-4xl">{exercise.icon}</div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-bold">{exercise.name}</h3>
                            {isCompleted && (
                              <span className="flex items-center gap-1 text-green-600 text-sm">
                                <Check className="w-4 h-4" />
                                Completed
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                              {exercise.difficulty}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              {exercise.duration}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-gray-600">
                              <TrendingUp className="w-4 h-4" />
                              {exercise.calories} cal
                            </span>
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                              {exercise.category}
                            </span>
                          </div>

                          {/* Benefits */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {exercise.benefits.map((benefit, idx) => (
                              <span key={idx} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                ✓ {benefit}
                              </span>
                            ))}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-3">
                            <button
                              onClick={() => setExpandedExercise(isExpanded ? null : exercise.id)}
                              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium flex items-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              {isExpanded ? 'Hide Steps' : 'View Steps'}
                            </button>
                            <button
                              onClick={() => toggleComplete(exercise.id)}
                              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium border-2 ${
                                isCompleted
                                  ? 'border-green-500 text-green-600 bg-green-50'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {isCompleted ? 'Completed' : 'Mark Complete'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Steps */}
                    {isExpanded && (
                      <div className="px-6 pb-6 border-t border-gray-100 pt-6">
                        <h4 className="font-semibold mb-4">Step-by-Step Guide:</h4>
                        <ol className="space-y-3">
                          {exercise.steps.map((step, idx) => (
                            <li key={idx} className="flex gap-3">
                              <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-semibold">
                                {idx + 1}
                              </span>
                              <span className="text-gray-700 pt-0.5">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's Progress */}
            <div className="border border-gray-200 rounded-lg p-6 sticky top-24">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Today's Progress
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Exercises Done</span>
                    <span className="font-semibold">{completedExercises.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${Math.min((completedExercises.length / 3) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Goal: 3 exercises</p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Calories Burned</span>
                    <span className="font-semibold">{totalCaloriesBurned}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all"
                      style={{ width: `${Math.min((totalCaloriesBurned / 300) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Goal: 300 calories</p>
                </div>
              </div>
            </div>

            {/* Weekly Stats */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                This Week
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Workouts</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Days</span>
                  <span className="font-semibold">5/7</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Minutes</span>
                  <span className="font-semibold">185</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Calories Burned</span>
                  <span className="font-semibold">1,240</span>
                </div>
              </div>
            </div>

            {/* Exercise Tips */}
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">💡 Exercise Tips</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Start slow and gradually increase intensity</li>
                <li>• Stay hydrated before, during, and after</li>
                <li>• Listen to your body and rest when needed</li>
                <li>• Consistency matters more than intensity</li>
                <li>• Combine different exercise types</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
