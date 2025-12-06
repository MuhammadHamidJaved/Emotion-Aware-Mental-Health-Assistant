'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import {
  apiGetCalendarMonth,
  apiGetCalendarDayDetails,
  apiGetCalendarMonthSummary,
  type CalendarDayEntry,
  type CalendarMonthData,
  type DayEntryDetail,
  type MonthSummary
} from '@/lib/api';
import ProtectedPage from '@/components/ProtectedPage';

interface DayEntry extends CalendarDayEntry {}

const EMOTION_COLORS: Record<string, string> = {
  happy: 'bg-yellow-500',
  calm: 'bg-teal-500',
  anxious: 'bg-purple-500',
  sad: 'bg-blue-500',
  angry: 'bg-red-500',
  energetic: 'bg-orange-500',
  grateful: 'bg-emerald-500',
  confident: 'bg-amber-500',
  loved: 'bg-rose-500',
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayEntry | null>(null);
  const [selectedDayEntries, setSelectedDayEntries] = useState<DayEntryDetail[]>([]);
  const [calendarData, setCalendarData] = useState<CalendarMonthData>({});
  const [monthSummary, setMonthSummary] = useState<MonthSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const formatDate = (year: number, month: number, day: number): string => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Load calendar data when month changes
  useEffect(() => {
    const loadCalendarData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (!accessToken) {
          setIsLoading(false);
          return;
        }

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed

        const [monthData, summaryData] = await Promise.allSettled([
          apiGetCalendarMonth(accessToken, year, month),
          apiGetCalendarMonthSummary(accessToken, year, month)
        ]);

        if (monthData.status === 'fulfilled') {
          setCalendarData(monthData.value);
        } else {
          console.error('Failed to load calendar data:', monthData.reason);
          setCalendarData({});
        }

        if (summaryData.status === 'fulfilled') {
          setMonthSummary(summaryData.value);
        } else {
          console.error('Failed to load month summary:', summaryData.reason);
        }
      } catch (err) {
        console.error('Failed to load calendar data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load calendar data');
        setCalendarData({});
      } finally {
        setIsLoading(false);
      }
    };

    loadCalendarData();
  }, [currentDate]);

  const getDayData = (day: number | null): DayEntry | null => {
    if (!day) return null;
    const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
    return calendarData[dateStr] || null;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const handleDayClick = async (day: number | null) => {
    if (!day) return;
    const dayData = getDayData(day);
    if (dayData) {
      setSelectedDay(dayData);
      
      // Load day details
      try {
        const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (accessToken) {
          const entries = await apiGetCalendarDayDetails(accessToken, dayData.date);
          setSelectedDayEntries(entries);
        }
      } catch (err) {
        console.error('Failed to load day details:', err);
        setSelectedDayEntries([]);
      }
    }
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && 
                         currentDate.getFullYear() === today.getFullYear();

  return (
    <ProtectedPage>
      <div className="space-y-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Mood Calendar</h1>
          <p className="text-sm text-neutral-600">Track your emotional journey over time</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        )}

        {!isLoading && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Calendar Header */}
              <div className="bg-gray-50 p-4 flex items-center justify-between border-b border-gray-200">
                <button
                  onClick={previousMonth}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Day Names */}
              <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                {dayNames.map(name => (
                  <div key={name} className="p-3 text-center text-sm font-medium text-gray-600">
                    {name}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7">
                {days.map((day, idx) => {
                  const dayData = getDayData(day);
                  const isToday = isCurrentMonth && day === today.getDate();
                  const hasEntry = dayData !== null;
                  const isSelected = selectedDay?.date === formatDate(
                    currentDate.getFullYear(), 
                    currentDate.getMonth(), 
                    day || 0
                  );

                  return (
                    <button
                      key={idx}
                      onClick={() => handleDayClick(day)}
                      disabled={!day || !hasEntry}
                      className={`aspect-square p-2 border-r border-b border-gray-100 relative hover:bg-gray-50 transition-colors ${
                        !day ? 'bg-gray-50' : ''
                      } ${isSelected ? 'ring-2 ring-black ring-inset' : ''} ${
                        !hasEntry ? 'cursor-default' : 'cursor-pointer'
                      }`}
                    >
                      {day && (
                        <>
                          {/* Day Number */}
                          <div className={`text-sm font-medium mb-1 ${
                            isToday ? 'bg-black text-white w-6 h-6 rounded-full flex items-center justify-center mx-auto' : ''
                          }`}>
                            {day}
                          </div>

                          {/* Mood Indicator */}
                          {dayData && (
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-2xl">{dayData.emoji}</span>
                              <div className="flex gap-0.5">
                                {[...Array(dayData.entryCount)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      EMOTION_COLORS[dayData.dominantEmotion] || 'bg-gray-400'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Legend</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {today.getDate()}
                  </div>
                  <span className="text-gray-600">Today</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">😊</span>
                  <span className="text-gray-600">Emoji = Dominant Emotion</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"/>
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"/>
                  </div>
                  <span className="text-gray-600">Dots = Entry Count</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Day Details */}
          <div>
            <div className="border border-gray-200 rounded-lg p-6 sticky top-6">
              {selectedDay ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold">
                      {new Date(selectedDay.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </h3>
                  </div>

                  {/* Dominant Emotion */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
                    <div className="text-5xl mb-3">{selectedDay.emoji}</div>
                    <div className="text-lg font-semibold capitalize mb-1">
                      {selectedDay.dominantEmotion}
                    </div>
                    <div className="text-sm text-gray-600">Dominant Emotion</div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Check-Ins</span>
                      <span className="font-semibold">{selectedDay.entryCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Mood Score</span>
                      <span className="font-semibold">{selectedDay.moodScore}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-black rounded-full transition-all"
                        style={{ width: `${selectedDay.moodScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Entry List */}
                  {selectedDayEntries.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold mb-3 text-gray-700">Entries</h4>
                      <div className="space-y-2">
                        {selectedDayEntries.map((entry) => (
                          <Link
                            key={entry.id}
                            href={`/check-in/${entry.id}`}
                            className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="text-sm font-medium mb-1">{entry.title}</div>
                            <div className="text-xs text-gray-600 line-clamp-2">{entry.text_content}</div>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                              <span className="capitalize">{entry.emotion}</span>
                              <span>•</span>
                              <span>{entry.word_count} words</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2">
                    <Link
                      href="/check-in"
                      className="block w-full px-4 py-2 bg-black text-white text-center rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                    >
                      View All Check-Ins
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    Click on a day with entries to see details
                  </p>
                </div>
              )}
            </div>

            {/* Monthly Summary */}
            <div className="border border-gray-200 rounded-lg p-6 mt-6">
              <h3 className="font-semibold mb-4">Month Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Entries</span>
                  <span className="font-semibold">
                    {monthSummary?.total_entries || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Days Logged</span>
                  <span className="font-semibold">
                    {monthSummary?.days_logged || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Mood Score</span>
                  <span className="font-semibold">
                    {monthSummary?.avg_mood_score || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
          </div>
          )}
      </div>
    </ProtectedPage>
  );
}
