'use client';

import { useState } from 'react';
import { Quote, Heart, Share2, RefreshCw, Sparkles, TrendingUp } from 'lucide-react';

interface QuoteData {
  id: string;
  text: string;
  author: string;
  category: string;
  emotion: string;
}

const QUOTES: QuoteData[] = [
  // Motivation
  { id: '1', text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', category: 'Motivation', emotion: 'energetic' },
  { id: '2', text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt', category: 'Motivation', emotion: 'confident' },
  { id: '3', text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill', category: 'Motivation', emotion: 'confident' },
  { id: '4', text: 'Don\'t watch the clock; do what it does. Keep going.', author: 'Sam Levenson', category: 'Motivation', emotion: 'energetic' },
  
  // Happiness
  { id: '5', text: 'Happiness is not something ready made. It comes from your own actions.', author: 'Dalai Lama', category: 'Happiness', emotion: 'happy' },
  { id: '6', text: 'The purpose of our lives is to be happy.', author: 'Dalai Lama', category: 'Happiness', emotion: 'happy' },
  { id: '7', text: 'Happiness is when what you think, what you say, and what you do are in harmony.', author: 'Mahatma Gandhi', category: 'Happiness', emotion: 'happy' },
  { id: '8', text: 'For every minute you are angry you lose sixty seconds of happiness.', author: 'Ralph Waldo Emerson', category: 'Happiness', emotion: 'happy' },
  
  // Calm
  { id: '9', text: 'Peace comes from within. Do not seek it without.', author: 'Buddha', category: 'Calm', emotion: 'calm' },
  { id: '10', text: 'The present moment is the only time over which we have dominion.', author: 'Thich Nhat Hanh', category: 'Calm', emotion: 'calm' },
  { id: '11', text: 'Within you, there is a stillness and a sanctuary to which you can retreat at any time.', author: 'Hermann Hesse', category: 'Calm', emotion: 'calm' },
  { id: '12', text: 'Calm mind brings inner strength and self-confidence.', author: 'Dalai Lama', category: 'Calm', emotion: 'calm' },
  
  // Resilience
  { id: '13', text: 'What lies behind us and what lies before us are tiny matters compared to what lies within us.', author: 'Ralph Waldo Emerson', category: 'Resilience', emotion: 'confident' },
  { id: '14', text: 'The oak fought the wind and was broken, the willow bent when it must and survived.', author: 'Robert Jordan', category: 'Resilience', emotion: 'calm' },
  { id: '15', text: 'Rock bottom became the solid foundation on which I rebuilt my life.', author: 'J.K. Rowling', category: 'Resilience', emotion: 'confident' },
  { id: '16', text: 'Life doesn\'t get easier or more forgiving, we get stronger and more resilient.', author: 'Steve Maraboli', category: 'Resilience', emotion: 'confident' },
  
  // Gratitude
  { id: '17', text: 'Gratitude turns what we have into enough.', author: 'Aesop', category: 'Gratitude', emotion: 'grateful' },
  { id: '18', text: 'The roots of all goodness lie in the soil of appreciation for goodness.', author: 'Dalai Lama', category: 'Gratitude', emotion: 'grateful' },
  { id: '19', text: 'Enjoy the little things, for one day you may look back and realize they were the big things.', author: 'Robert Brault', category: 'Gratitude', emotion: 'grateful' },
  { id: '20', text: 'Gratitude is not only the greatest of virtues, but the parent of all others.', author: 'Cicero', category: 'Gratitude', emotion: 'grateful' },
  
  // Confidence
  { id: '21', text: 'You are braver than you believe, stronger than you seem, and smarter than you think.', author: 'A.A. Milne', category: 'Confidence', emotion: 'confident' },
  { id: '22', text: 'No one can make you feel inferior without your consent.', author: 'Eleanor Roosevelt', category: 'Confidence', emotion: 'confident' },
  { id: '23', text: 'The most beautiful thing you can wear is confidence.', author: 'Blake Lively', category: 'Confidence', emotion: 'confident' },
  { id: '24', text: 'With confidence, you have won before you have started.', author: 'Marcus Garvey', category: 'Confidence', emotion: 'confident' },
  
  // Comfort (for sad/anxious moods)
  { id: '25', text: 'This too shall pass.', author: 'Persian Proverb', category: 'Comfort', emotion: 'sad' },
  { id: '26', text: 'You are allowed to be both a masterpiece and a work in progress simultaneously.', author: 'Sophia Bush', category: 'Comfort', emotion: 'anxious' },
  { id: '27', text: 'Healing takes time, and asking for help is a courageous step.', author: 'Mariska Hargitay', category: 'Comfort', emotion: 'sad' },
  { id: '28', text: 'It\'s okay to not be okay. It\'s okay to ask for help.', author: 'Unknown', category: 'Comfort', emotion: 'anxious' },
];

export default function QuotesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [dailyQuote, setDailyQuote] = useState<QuoteData>(QUOTES[0]);

  const categories = ['All', 'Motivation', 'Happiness', 'Calm', 'Resilience', 'Gratitude', 'Confidence', 'Comfort'];

  const filteredQuotes = selectedCategory === 'All'
    ? QUOTES
    : QUOTES.filter(q => q.category === selectedCategory);

  const toggleFavorite = (id: string) => {
    setFavorites(prev =>
      prev.includes(id)
        ? prev.filter(qid => qid !== id)
        : [...prev, id]
    );
  };

  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    setDailyQuote(QUOTES[randomIndex]);
  };

  const shareQuote = (quote: QuoteData) => {
    if (navigator.share) {
      navigator.share({
        title: 'Inspirational Quote',
        text: `"${quote.text}" - ${quote.author}`,
      });
    } else {
      // Fallback: copy to clipboard
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
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
              <Quote className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Daily Quotes</h1>
              <p className="text-gray-600">Inspiration and motivation for your journey</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quote of the Day */}
            <div className="border-2 border-black rounded-xl p-8 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200 rounded-full blur-3xl opacity-30" />
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-semibold text-gray-600">Quote of the Day</span>
                  </div>
                  <button
                    onClick={getRandomQuote}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Get random quote"
                  >
                    <RefreshCw className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                
                <Quote className="w-12 h-12 text-gray-300 mb-4" />
                
                <p className="text-2xl font-serif leading-relaxed mb-6">
                  {dailyQuote.text}
                </p>
                
                <div className="flex items-center justify-between">
                  <p className="text-lg text-gray-600 font-medium">— {dailyQuote.author}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleFavorite(dailyQuote.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        favorites.includes(dailyQuote.id)
                          ? 'bg-red-100 text-red-500'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${favorites.includes(dailyQuote.id) ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => shareQuote(dailyQuote)}
                      className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <h2 className="text-xl font-bold mb-4">Explore by Category</h2>
              <div className="flex flex-wrap gap-2">
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
            </div>

            {/* Quote Library */}
            <div>
              <h2 className="text-xl font-bold mb-4">
                {selectedCategory === 'All' ? 'All Quotes' : `${selectedCategory} Quotes`}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({filteredQuotes.length})
                </span>
              </h2>
              
              <div className="space-y-4">
                {filteredQuotes.map((quote) => {
                  const isFavorite = favorites.includes(quote.id);
                  
                  return (
                    <div
                      key={quote.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex gap-4">
                        <Quote className="w-8 h-8 text-gray-300 flex-shrink-0" />
                        
                        <div className="flex-1">
                          <p className="text-lg font-serif mb-3 leading-relaxed">
                            {quote.text}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <p className="text-gray-600 font-medium">— {quote.author}</p>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(quote.category)}`}>
                                {quote.category}
                              </span>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => toggleFavorite(quote.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  isFavorite
                                    ? 'bg-red-100 text-red-500'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                              </button>
                              <button
                                onClick={() => shareQuote(quote)}
                                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Favorites */}
            <div className="border border-gray-200 rounded-lg p-6 sticky top-24">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Saved Quotes
              </h3>
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-black">{favorites.length}</p>
                <p className="text-sm text-gray-600 mt-1">quotes saved</p>
              </div>
              {favorites.length > 0 && (
                <button className="w-full mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                  View All Favorites
                </button>
              )}
            </div>

            {/* Reading Stats */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Your Stats
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Days Active</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quotes Read</span>
                  <span className="font-semibold">87</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Favorite Category</span>
                  <span className="font-semibold">Motivation</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Streak</span>
                  <span className="font-semibold">5 days 🔥</span>
                </div>
              </div>
            </div>

            {/* Quote Categories Info */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold mb-4">Categories</h3>
              <div className="space-y-2 text-sm">
                {categories.filter(c => c !== 'All').map((category) => {
                  const count = QUOTES.filter(q => q.category === category).length;
                  return (
                    <div key={category} className="flex justify-between items-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(category)}`}>
                        {category}
                      </span>
                      <span className="text-gray-600">{count} quotes</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daily Reminder */}
            <div className="border border-purple-200 bg-purple-50 rounded-lg p-6">
              <h3 className="font-semibold text-purple-900 mb-3">💜 Daily Reminder</h3>
              <p className="text-sm text-purple-800 mb-4">
                Get inspired every day! Enable daily quote notifications to start your morning with positivity.
              </p>
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                Enable Notifications
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
