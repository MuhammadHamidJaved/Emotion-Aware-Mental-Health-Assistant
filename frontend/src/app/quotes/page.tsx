'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Quote, Heart, Share2, RefreshCw, Sparkles, TrendingUp, Loader2, Settings } from 'lucide-react';
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

const EMOTION_OPTIONS = [
  { key: 'all', label: 'All Moods', emoji: '🌈' },
  { key: 'happy', label: 'Happy', emoji: '😊' },
  { key: 'calm', label: 'Calm', emoji: '😌' },
  { key: 'sad', label: 'Sad', emoji: '😢' },
  { key: 'anxious', label: 'Anxious', emoji: '😰' },
  { key: 'confident', label: 'Confident', emoji: '💪' },
  { key: 'grateful', label: 'Grateful', emoji: '🙏' },
];

export default function QuotesPage() {
  const searchParams = useSearchParams();
  const urlEmotion = searchParams?.get('emotion') || null;

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedEmotion, setSelectedEmotion] = useState<string>(urlEmotion || 'all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [dailyQuote, setDailyQuote] = useState<QuoteData>(FALLBACK_QUOTES[0]);
  const [apiQuotes, setApiQuotes] = useState<QuoteData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [allQuotes, setAllQuotes] = useState<QuoteData[]>(FALLBACK_QUOTES);
  const [userPrefs, setUserPrefs] = useState<Partial<RecommendationSettings>>({});

  // Load saved user preferences so content_language is forwarded to the microservice.
  useEffect(() => {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!accessToken) return;
    apiGetRecommendationSettings(accessToken)
      .then(prefs => setUserPrefs(prefs))
      .catch(() => {});
  }, []);

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
        emotion: emotion === 'all' ? 'neutral' : emotion,
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
            author: 'Personalized',
            category: 'Personalized',
            emotion,
          });
        } else if (Array.isArray(quoteData)) {
          quoteData.forEach((q: any, idx: number) => {
            quotes.push({
              id: `api-${idx}`,
              text: typeof q === 'string' ? q : q.text || q.quote || '',
              author: (typeof q === 'object' ? q.author : '') || 'Inspirational',
              category: (typeof q === 'object' ? q.category : '') || 'Personalized',
              emotion,
            });
          });
        }

        if (quotes.length > 0) {
          setApiQuotes(quotes);
          // Merge: API quotes first, then fallback
          setAllQuotes([...quotes, ...FALLBACK_QUOTES]);
          setDailyQuote(quotes[0]);
        } else {
          setUsingFallback(true);
          setAllQuotes(FALLBACK_QUOTES);
        }
      } else {
        setUsingFallback(true);
        setAllQuotes(FALLBACK_QUOTES);
      }
    } catch (err) {
      console.error('Failed to fetch personalized quotes:', err);
      setUsingFallback(true);
      setAllQuotes(FALLBACK_QUOTES);
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
      case 'Personalized': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Quote className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none">Daily Quotes</h1>
              <p className="text-xs text-gray-500 mt-0.5">{usingFallback ? 'Default library' : 'Personalized for you'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/settings" className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Personalization settings">
              <Settings className="w-4 h-4 text-gray-500" />
            </a>
            <button onClick={() => fetchPersonalizedQuotes(selectedEmotion)} disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-xs font-medium disabled:opacity-50">
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Banners */}
        {usingFallback && !isLoading && (
          <div className="mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center gap-2">
            <span>⚠️</span>
            <span>Showing default quotes. <a href="/settings" className="underline font-medium">Set your preferences</a> for personalized content.</span>
          </div>
        )}
        {urlEmotion && !usingFallback && !isLoading && (
          <div className="mb-4 px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-700 flex items-center gap-2">
            <span>✨</span>
            <span>Quotes tailored for your <strong className="capitalize">{urlEmotion}</strong> emotion from your last check-in.</span>
            <a href="/quotes" className="ml-auto text-xs text-indigo-400 hover:underline">Clear</a>
          </div>
        )}

        {/* Mood indicator */}
        {urlEmotion ? (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs font-medium text-gray-500">Detected mood:</span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-black text-white border border-black shadow-sm">
              <span>{EMOTION_OPTIONS.find(e => e.key === selectedEmotion)?.emoji}</span>
              {EMOTION_OPTIONS.find(e => e.key === selectedEmotion)?.label}
            </span>
            <span className="text-xs text-gray-400">— from your last check-in</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs font-medium text-gray-500 mr-1">Choose mood:</span>
            {EMOTION_OPTIONS.map((emo) => (
              <button key={emo.key} onClick={() => setSelectedEmotion(emo.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  selectedEmotion === emo.key ? 'bg-black text-white border-black shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}>
                <span>{emo.emoji}</span>{emo.label}
              </button>
            ))}
          </div>
        )}

        {/* Main layout */}
        <div className="grid lg:grid-cols-[1fr_260px] gap-6">
          <div className="space-y-5">
            {/* Featured Quote Hero */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                        {apiQuotes.length > 0 ? 'Personalized Quote' : 'Quote of the Day'}
                      </span>
                    </div>
                    <button onClick={getRandomQuote} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Random quote">
                      <RefreshCw className="w-4 h-4 text-gray-300" />
                    </button>
                  </div>
                  <blockquote className="text-2xl font-serif leading-relaxed mb-5 text-white/95">
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
              <div className="flex items-center justify-between mb-3">
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                        selectedCategory === cat ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}>
                      {cat}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{filteredQuotes.length} quotes</span>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-7 h-7 animate-spin text-gray-300 mb-3" />
                  <p className="text-sm text-gray-400">Loading personalized quotes…</p>
                </div>
              ) : filteredQuotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Quote className="w-10 h-10 mb-3 text-gray-200" />
                  <p className="text-sm">No quotes for this filter.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredQuotes.map((quote) => {
                    const isFav = favorites.includes(quote.id);
                    return (
                      <div key={quote.id}
                        className={`bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow ${quote.id.startsWith('api-') ? 'border-indigo-200' : 'border-gray-200'}`}>
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

          {/* Sidebar */}
          <div className="space-y-4 sticky top-20 self-start">
            {/* Saved */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
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
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5" /> Library
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
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Categories</h3>
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
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-purple-800 mb-2">💜 Daily Reminder</h3>
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
