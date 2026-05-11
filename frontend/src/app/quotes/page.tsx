'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Quote, Heart, Share2, Shuffle, Sparkles, TrendingUp, Loader2 } from 'lucide-react';
import { apiGetPersonalizedRecommendations, apiSendRecommendationFeedback, apiGetRecommendationSettings, type RecommendationSettings } from '@/lib/api';

interface QuoteData {
  id: string;
  text: string;
  author: string;
  category: string;
  emotion: string;
}

// Fallback quotes when microservice is unavailable
const FALLBACK_QUOTES: QuoteData[] = [
  { id: '1', text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', category: 'Motivation', emotion: 'energetic' },
  { id: '2', text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt', category: 'Motivation', emotion: 'confident' },
  { id: '3', text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill', category: 'Motivation', emotion: 'confident' },
  { id: '4', text: 'Don\'t watch the clock; do what it does. Keep going.', author: 'Sam Levenson', category: 'Motivation', emotion: 'energetic' },
  { id: '5', text: 'Happiness is not something ready made. It comes from your own actions.', author: 'Dalai Lama', category: 'Happiness', emotion: 'happy' },
  { id: '6', text: 'The purpose of our lives is to be happy.', author: 'Dalai Lama', category: 'Happiness', emotion: 'happy' },
  { id: '7', text: 'Happiness is when what you think, what you say, and what you do are in harmony.', author: 'Mahatma Gandhi', category: 'Happiness', emotion: 'happy' },
  { id: '8', text: 'For every minute you are angry you lose sixty seconds of happiness.', author: 'Ralph Waldo Emerson', category: 'Happiness', emotion: 'happy' },
  { id: '9', text: 'Peace comes from within. Do not seek it without.', author: 'Buddha', category: 'Calm', emotion: 'calm' },
  { id: '10', text: 'The present moment is the only time over which we have dominion.', author: 'Thich Nhat Hanh', category: 'Calm', emotion: 'calm' },
  { id: '11', text: 'Within you, there is a stillness and a sanctuary to which you can retreat at any time.', author: 'Hermann Hesse', category: 'Calm', emotion: 'calm' },
  { id: '12', text: 'Calm mind brings inner strength and self-confidence.', author: 'Dalai Lama', category: 'Calm', emotion: 'calm' },
  { id: '13', text: 'What lies behind us and what lies before us are tiny matters compared to what lies within us.', author: 'Ralph Waldo Emerson', category: 'Resilience', emotion: 'confident' },
  { id: '14', text: 'The oak fought the wind and was broken, the willow bent when it must and survived.', author: 'Robert Jordan', category: 'Resilience', emotion: 'calm' },
  { id: '15', text: 'Rock bottom became the solid foundation on which I rebuilt my life.', author: 'J.K. Rowling', category: 'Resilience', emotion: 'confident' },
  { id: '16', text: 'Life doesn\'t get easier or more forgiving, we get stronger and more resilient.', author: 'Steve Maraboli', category: 'Resilience', emotion: 'confident' },
  { id: '17', text: 'Gratitude turns what we have into enough.', author: 'Aesop', category: 'Gratitude', emotion: 'grateful' },
  { id: '18', text: 'The roots of all goodness lie in the soil of appreciation for goodness.', author: 'Dalai Lama', category: 'Gratitude', emotion: 'grateful' },
  { id: '19', text: 'Enjoy the little things, for one day you may look back and realize they were the big things.', author: 'Robert Brault', category: 'Gratitude', emotion: 'grateful' },
  { id: '20', text: 'Gratitude is not only the greatest of virtues, but the parent of all others.', author: 'Cicero', category: 'Gratitude', emotion: 'grateful' },
  { id: '21', text: 'You are braver than you believe, stronger than you seem, and smarter than you think.', author: 'A.A. Milne', category: 'Confidence', emotion: 'confident' },
  { id: '22', text: 'No one can make you feel inferior without your consent.', author: 'Eleanor Roosevelt', category: 'Confidence', emotion: 'confident' },
  { id: '23', text: 'The most beautiful thing you can wear is confidence.', author: 'Blake Lively', category: 'Confidence', emotion: 'confident' },
  { id: '24', text: 'With confidence, you have won before you have started.', author: 'Marcus Garvey', category: 'Confidence', emotion: 'confident' },
  { id: '25', text: 'This too shall pass.', author: 'Persian Proverb', category: 'Comfort', emotion: 'sad' },
  { id: '26', text: 'You are allowed to be both a masterpiece and a work in progress simultaneously.', author: 'Sophia Bush', category: 'Comfort', emotion: 'anxious' },
  { id: '27', text: 'Healing takes time, and asking for help is a courageous step.', author: 'Mariska Hargitay', category: 'Comfort', emotion: 'sad' },
  { id: '28', text: 'It\'s okay to not be okay. It\'s okay to ask for help.', author: 'Unknown', category: 'Comfort', emotion: 'anxious' },
];

const EMOTION_META: Record<string, { label: string; emoji: string }> = {
  happy: { label: 'Happy', emoji: '😊' },
  calm: { label: 'Calm', emoji: '😌' },
  sad: { label: 'Sad', emoji: '😢' },
  anxious: { label: 'Anxious', emoji: '😰' },
  confident: { label: 'Confident', emoji: '💪' },
  grateful: { label: 'Grateful', emoji: '🙏' },
  energetic: { label: 'Energetic', emoji: '⚡' },
};

const normalizeToQuoteEmotion = (emotion: string | null): string => {
  const source = (emotion || '').toLowerCase().trim();
  if (!source) return 'calm';
  if (EMOTION_META[source]) return source;

  const map: Record<string, string> = {
    neutral: 'calm',
    tired: 'calm',
    peaceful: 'calm',
    relaxed: 'calm',
    frustrated: 'anxious',
    fear: 'anxious',
    angry: 'anxious',
    lonely: 'sad',
    disappointed: 'sad',
    excited: 'energetic',
  };
  return map[source] || 'calm';
};

const getFallbackQuotesForEmotion = (emotion: string): QuoteData[] =>
  FALLBACK_QUOTES.filter((q) => q.emotion === emotion);

const getCategoryForEmotion = (emotion: string): string => {
  switch (emotion) {
    case 'happy':
      return 'Happiness';
    case 'calm':
      return 'Calm';
    case 'sad':
    case 'anxious':
      return 'Comfort';
    case 'grateful':
      return 'Gratitude';
    case 'confident':
    case 'energetic':
      return 'Motivation';
    default:
      return 'Comfort';
  }
};

function QuotesPageContent() {
  const searchParams = useSearchParams();
  const urlEmotion = searchParams?.get('emotion') || null;

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedEmotion, setSelectedEmotion] = useState<string>(normalizeToQuoteEmotion(urlEmotion));
  const [predictedEmotionLabel, setPredictedEmotionLabel] = useState<string>((urlEmotion || '').trim());
  const [favorites, setFavorites] = useState<string[]>([]);
  const [dailyQuote, setDailyQuote] = useState<QuoteData>(FALLBACK_QUOTES[0]);
  const [apiQuotes, setApiQuotes] = useState<QuoteData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [allQuotes, setAllQuotes] = useState<QuoteData[]>(getFallbackQuotesForEmotion(normalizeToQuoteEmotion(urlEmotion)));
  const [userPrefs, setUserPrefs] = useState<Partial<RecommendationSettings>>({});

  // Load saved user preferences so content_language is forwarded to the microservice.
  useEffect(() => {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!accessToken) return;
    apiGetRecommendationSettings(accessToken)
      .then(prefs => setUserPrefs(prefs))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fromUrl = (searchParams?.get('emotion') || '').trim();
    if (fromUrl) {
      setPredictedEmotionLabel(fromUrl);
      setSelectedEmotion(normalizeToQuoteEmotion(fromUrl));
      return;
    }

    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('lastRecommendations');
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      const detected = (parsed?.emotion || '').trim();
      if (detected) {
        setPredictedEmotionLabel(detected);
        setSelectedEmotion(normalizeToQuoteEmotion(detected));
      }
    } catch {
      // Ignore malformed cache.
    }
  }, [searchParams]);

  const categories = ['All', 'Motivation', 'Happiness', 'Calm', 'Resilience', 'Gratitude', 'Confidence', 'Comfort'];

  const fetchPersonalizedQuotes = useCallback(async (emotion: string) => {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!accessToken) {
      setUsingFallback(true);
      setAllQuotes(FALLBACK_QUOTES);
      return;
    }

    setIsLoading(true);
    setUsingFallback(false);

    try {
      const data = await apiGetPersonalizedRecommendations(accessToken, {
        emotion,
        types: ['quote'],
        preferences: {
          content_language: userPrefs.content_language,
          age_group: userPrefs.age_group,
        },
      });

      const quoteData = data.recommendations?.quote;
      if (quoteData) {
        // The microservice may return a single quote string or an array
        const quotes: QuoteData[] = [];

        if (typeof quoteData === 'string') {
          quotes.push({
            id: 'api-1',
            text: quoteData,
            author: 'Inspirational',
            category: getCategoryForEmotion(emotion),
            emotion,
          });
        } else if (Array.isArray(quoteData)) {
          quoteData.forEach((q: unknown, idx: number) => {
            const quoteObj = typeof q === 'object' && q !== null ? (q as Record<string, unknown>) : null;
            quotes.push({
              id: `api-${idx}`,
              text: typeof q === 'string' ? q : String(quoteObj?.text || quoteObj?.quote || ''),
              author: String(quoteObj?.author || 'Inspirational'),
              category: String(quoteObj?.category || getCategoryForEmotion(emotion)),
              emotion,
            });
          });
        }

        if (quotes.length > 0) {
          setApiQuotes(quotes);
          // Merge: API quotes first, then emotion-matched fallback quotes only.
          setAllQuotes([...quotes, ...getFallbackQuotesForEmotion(emotion)]);
          setDailyQuote(quotes[0]);
        } else {
          setUsingFallback(true);
          const fallback = getFallbackQuotesForEmotion(emotion);
          setAllQuotes(fallback);
          setDailyQuote(fallback[0] || FALLBACK_QUOTES[0]);
        }
      } else {
        setUsingFallback(true);
        const fallback = getFallbackQuotesForEmotion(emotion);
        setAllQuotes(fallback);
        setDailyQuote(fallback[0] || FALLBACK_QUOTES[0]);
      }
    } catch (err) {
      console.error('Failed to fetch personalized quotes:', err);
      setUsingFallback(true);
      const fallback = getFallbackQuotesForEmotion(emotion);
      setAllQuotes(fallback);
      setDailyQuote(fallback[0] || FALLBACK_QUOTES[0]);
    } finally {
      setIsLoading(false);
    }
  }, [userPrefs]);

  useEffect(() => {
    fetchPersonalizedQuotes(selectedEmotion);
  }, [selectedEmotion, fetchPersonalizedQuotes]);

  const filteredQuotes = selectedCategory === 'All'
    ? allQuotes
    : allQuotes.filter(q => q.category === selectedCategory);

  const toggleFavorite = (id: string) => {
    const wasLiked = favorites.includes(id);
    setFavorites(prev =>
      prev.includes(id)
        ? prev.filter(qid => qid !== id)
        : [...prev, id]
    );

    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (accessToken && id.startsWith('api-')) {
      apiSendRecommendationFeedback(accessToken, {
        recommendation_id: id,
        item_id: id,
        feedback_type: wasLiked ? 'dislike' : 'like',
        recommendation_type: 'quote',
      }).catch(() => {});
    }
  };

  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * allQuotes.length);
    setDailyQuote(allQuotes[randomIndex]);
  };

  const shareQuote = (quote: QuoteData) => {
    if (navigator.share) {
      navigator.share({
        title: 'Inspirational Quote',
        text: `"${quote.text}" - ${quote.author}`,
      });
    } else {
      navigator.clipboard.writeText(`"${quote.text}" - ${quote.author}`);
      alert('Quote copied to clipboard!');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Motivation': return 'bg-orange-100 text-orange-700';
      case 'Happiness': return 'bg-yellow-100 text-yellow-700';
      case 'Calm': return 'bg-blue-100 text-blue-700';
      case 'Resilience': return 'bg-purple-100 text-purple-700';
      case 'Gratitude': return 'bg-green-100 text-green-700';
      case 'Confidence': return 'bg-pink-100 text-pink-700';
      case 'Comfort': return 'bg-teal-100 text-teal-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-50 text-black -mx-4 sm:-mx-6">
      <div className="border-b border-neutral-200 bg-white px-4 sm:px-6 py-3.5">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 shadow-sm">
            <Quote className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight text-neutral-900">Daily Quotes</h1>
            <p className="mt-0.5 truncate text-xs text-neutral-500">
              {usingFallback ? 'Curated library · personalize in Settings' : 'Matched to your mood'}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-5">
        {/* Banners */}
        {usingFallback && !isLoading && (
          <div className="mb-3 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-900 leading-snug sm:text-sm">
            <span className="mr-1">⚠️</span>
            Default quotes.{' '}
            <a href="/settings" className="font-medium underline underline-offset-2">
              Set preferences
            </a>{' '}
            for personalization.
          </div>
        )}
        {predictedEmotionLabel && !usingFallback && !isLoading && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-indigo-200/80 bg-indigo-50/90 px-3 py-2 text-xs text-indigo-900 sm:text-sm">
            <span>✨</span>
            <span>
              For <strong className="capitalize">{predictedEmotionLabel}</strong> from your check-in.
            </span>
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-neutral-500 sm:text-xs">Mood</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-900 bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
            <span>{EMOTION_META[selectedEmotion]?.emoji || '😌'}</span>
            {EMOTION_META[selectedEmotion]?.label || 'Calm'}
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,240px)] lg:gap-5">
          <div className="order-1 space-y-4 lg:order-none">
            {/* Featured Quote Hero */}
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
              <div className="relative overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-800 p-4 text-white sm:p-6">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Sparkles className="h-4 w-4 shrink-0 text-amber-300" />
                      <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-neutral-300 sm:text-xs">
                        {apiQuotes.length > 0 ? 'For You' : 'Featured'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={getRandomQuote}
                      className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-neutral-300 transition-colors hover:bg-white/10"
                      title="Shuffle quote"
                    >
                      <Shuffle className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Shuffle</span>
                    </button>
                  </div>
                  <blockquote className="mb-4 font-serif text-lg leading-relaxed text-white/95 sm:text-2xl">
                    &ldquo;{dailyQuote.text}&rdquo;
                  </blockquote>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400 font-medium">— {dailyQuote.author}</p>
                    <div className="flex gap-1.5">
                      <button onClick={() => toggleFavorite(dailyQuote.id)}
                        className={`p-2 rounded-lg transition-colors ${favorites.includes(dailyQuote.id) ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/10 text-gray-400'}`}>
                        <Heart className={`w-4 h-4 ${favorites.includes(dailyQuote.id) ? 'fill-current' : ''}`} />
                      </button>
                      <button onClick={() => shareQuote(dailyQuote)}
                        className="p-2 hover:bg-white/10 text-gray-400 rounded-lg transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category filter + quote grid */}
            <div>
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-full border px-2 py-1 text-[11px] font-medium transition-all sm:px-3 sm:py-1.5 sm:text-xs ${
                        selectedCategory === cat
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-neutral-400 sm:text-xs">{filteredQuotes.length} quotes</span>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="mb-2 h-6 w-6 animate-spin text-neutral-300" />
                  <p className="text-xs text-neutral-500 sm:text-sm">Loading quotes…</p>
                </div>
              ) : filteredQuotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Quote className="w-10 h-10 mb-3 text-gray-200" />
                  <p className="text-sm">No quotes for this filter.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredQuotes.map((quote) => {
                    const isFav = favorites.includes(quote.id);
                    return (
                      <div key={quote.id}
                        className={`rounded-xl border p-3 transition-shadow hover:shadow-sm sm:p-4 ${quote.id.startsWith('api-') ? 'border-indigo-200 bg-white' : 'border-neutral-200 bg-white'}`}>
                        <div className="flex gap-3">
                          <Quote className="w-5 h-5 text-gray-200 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-serif leading-relaxed text-gray-800 mb-2">&ldquo;{quote.text}&rdquo;</p>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-gray-500 font-medium">— {quote.author}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(quote.category)}`}>{quote.category}</span>
                                {quote.id.startsWith('api-') && (
                                  <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">✨ For You</span>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => toggleFavorite(quote.id)}
                                  className={`p-1.5 rounded-lg transition-colors ${isFav ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                                  <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                                </button>
                                <button onClick={() => shareQuote(quote)}
                                  className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="order-2 space-y-3 lg:sticky lg:top-20 lg:order-none lg:self-start">
            {/* Saved */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center">
              <Heart className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <p className="text-3xl font-bold">{favorites.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Saved quotes</p>
              {favorites.length > 0 && (
                <button className="mt-3 w-full px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-xs font-medium">
                  View All
                </button>
              )}
            </div>

            {/* Source stats */}
            <div className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-4">
              <h3 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                <TrendingUp className="h-3.5 w-3.5" /> Library
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Personalized', value: `${apiQuotes.length}` },
                  { label: 'Default', value: `${FALLBACK_QUOTES.length}` },
                  { label: 'Showing', value: `${filteredQuotes.length}` },
                  { label: 'Mode', value: usingFallback ? 'Default' : 'AI' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{s.label}</span>
                    <span className="text-xs font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories breakdown */}
            <div className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-4">
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Categories</h3>
              <div className="space-y-2">
                {categories.filter(c => c !== 'All').map((cat) => {
                  const count = allQuotes.filter(q => q.category === cat).length;
                  if (count === 0) return null;
                  return (
                    <button key={cat} onClick={() => setSelectedCategory(cat)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors ${
                        selectedCategory === cat ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'
                      }`}>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${getCategoryColor(cat)}`}>{cat}</span>
                      <span className="text-gray-400">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily reminder */}
            <div className="rounded-xl border border-violet-200/80 bg-violet-50/90 p-3 sm:p-4">
              <h3 className="mb-1.5 text-xs font-semibold text-violet-900">💜 Reminder</h3>
              <p className="text-xs text-purple-700 mb-3 leading-relaxed">Enable notifications to start each morning with an inspiring quote.</p>
              <button className="w-full px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium">
                Enable Notifications
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuotesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" aria-label="Loading" />
        </div>
      }
    >
      <QuotesPageContent />
    </Suspense>
  );
}
