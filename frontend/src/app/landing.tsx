import Link from 'next/link'
import { Brain, Mic, Video, Type, BarChart3, Lock, Zap, TrendingUp, Activity, Sparkles, ArrowRight, Check } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">EmotionJournal</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-neutral-600 hover:text-black transition-colors">Features</a>
            <a href="#ml-models" className="text-neutral-600 hover:text-black transition-colors">ML Models</a>
            <a href="#demo" className="text-neutral-600 hover:text-black transition-colors">Demo</a>
          </nav>
          
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-medium hover:bg-neutral-50 rounded-lg transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-full text-sm mb-8">
            <Sparkles className="w-4 h-4" />
            <span>95% accuracy with advanced ML models</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Detect emotions with
            <span className="block mt-2">AI-powered precision</span>
          </h1>
          
          <p className="text-xl text-neutral-600 mb-12 max-w-2xl mx-auto">
            Multi-modal emotion detection from text, voice, and video. Understand your mental health patterns with machine learning.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="px-8 py-4 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium flex items-center gap-2 group">
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/check-in/new" className="px-8 py-4 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium">
              Try Live Demo
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-neutral-600">
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>Free forever</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>Privacy-first</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-neutral-200 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-sm text-neutral-600">ML Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">16</div>
              <div className="text-sm text-neutral-600">Emotions Detected</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">3</div>
              <div className="text-sm text-neutral-600">Input Modalities</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-sm text-neutral-600">AI Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Multi-modal emotion detection</h2>
          <p className="text-xl text-neutral-600">Advanced ML models analyze your emotions across different input types</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 border border-neutral-200 rounded-lg hover:border-black transition-colors">
            <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center mb-6">
              <Type className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Text Analysis</h3>
            <p className="text-neutral-600 mb-4">
              Our NLP model achieves 94.7% accuracy in detecting emotions from written journal entries.
            </p>
            <div className="text-sm text-neutral-500">
              Model: BERT-based classifier • 8 emotion classes
            </div>
          </div>
          
          <div className="p-8 border border-neutral-200 rounded-lg hover:border-black transition-colors">
            <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center mb-6">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Voice Sentiment</h3>
            <p className="text-neutral-600 mb-4">
              Analyze tone, pitch, and speech patterns to detect emotions from voice recordings with 89.2% accuracy.
            </p>
            <div className="text-sm text-neutral-500">
              Model: Audio CNN • 6 emotion classes
            </div>
          </div>
          
          <div className="p-8 border border-neutral-200 rounded-lg hover:border-black transition-colors">
            <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center mb-6">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Facial Expression</h3>
            <p className="text-neutral-600 mb-4">
              Real-time facial emotion recognition from video entries with 93.4% accuracy using computer vision.
            </p>
            <div className="text-sm text-neutral-500">
              Model: ResNet-50 • 7 emotion classes
            </div>
          </div>
        </div>
      </section>

      {/* ML Models Section */}
      <section id="ml-models" className="bg-neutral-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powered by advanced ML models</h2>
            <p className="text-xl text-neutral-600">State-of-the-art deep learning architecture</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg border border-neutral-200">
              <div className="flex items-center gap-3 mb-6">
                <Brain className="w-8 h-8" />
                <div>
                  <h3 className="text-xl font-bold">Model Performance</h3>
                  <p className="text-sm text-neutral-600">Validated on 50K+ samples</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Text Emotion Classifier</span>
                    <span className="font-medium">94.7%</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-black" style={{ width: '94.7%' }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Facial Expression Recognition</span>
                    <span className="font-medium">93.4%</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-black" style={{ width: '93.4%' }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Voice Sentiment Analyzer</span>
                    <span className="font-medium">89.2%</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-black" style={{ width: '89.2%' }} />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-lg border border-neutral-200">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="w-8 h-8" />
                <div>
                  <h3 className="text-xl font-bold">Real-time Processing</h3>
                  <p className="text-sm text-neutral-600">Low-latency inference</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <span className="text-sm">Text Analysis</span>
                  <span className="text-sm font-medium">~234ms</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <span className="text-sm">Voice Processing</span>
                  <span className="text-sm font-medium">~456ms</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <span className="text-sm">Video Frame Analysis</span>
                  <span className="text-sm font-medium">~312ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">Visualize your emotional patterns</h2>
            <p className="text-xl text-neutral-600 mb-8">
              Advanced analytics and insights powered by your emotion data.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Mood History Charts</h3>
                  <p className="text-sm text-neutral-600">Track valence and arousal over time with interactive visualizations</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Pattern Recognition</h3>
                  <p className="text-sm text-neutral-600">Identify triggers and trends in your emotional well-being</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">AI Recommendations</h3>
                  <p className="text-sm text-neutral-600">Get personalized coping strategies based on your patterns</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-neutral-100 rounded-lg h-96 flex items-center justify-center">
            <BarChart3 className="w-24 h-24 text-neutral-400" />
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="bg-black text-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <Lock className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-6">Privacy-first by design</h2>
            <p className="text-xl text-neutral-300 mb-12">
              Your emotions are personal. All data is encrypted end-to-end and stored securely. You control who sees what.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div>
                <h3 className="font-semibold mb-2">End-to-End Encryption</h3>
                <p className="text-sm text-neutral-400">Military-grade AES-256 encryption</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Local or Cloud Storage</h3>
                <p className="text-sm text-neutral-400">You choose where your data lives</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">No Data Selling</h3>
                <p className="text-sm text-neutral-400">Your privacy is not for sale</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="bg-neutral-50 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to understand your emotions?</h2>
          <p className="text-xl text-neutral-600 mb-8">
            Start journaling with AI-powered emotion detection today.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="px-8 py-4 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium flex items-center gap-2 group">
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/ml-models" className="px-8 py-4 border border-neutral-300 rounded-lg hover:bg-white transition-colors font-medium">
              Explore ML Models
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold">EmotionJournal</span>
              </div>
              <p className="text-sm text-neutral-600">AI-powered emotion detection for mental wellness</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><a href="#features">Features</a></li>
                <li><a href="/ml-models">ML Models</a></li>
                <li><a href="/check-in/new">Live Demo</a></li>
                <li><a href="/dashboard">Dashboard</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><a href="#">Documentation</a></li>
                <li><a href="#">API Reference</a></li>
                <li><a href="#">Help Center</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><a href="/privacy">Privacy Policy</a></li>
                <li><a href="/terms">Terms of Service</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-neutral-200 pt-8 text-center text-sm text-neutral-600">
            © 2025 EmotionJournal. All rights reserved. Built for FYP-1.
          </div>
        </div>
      </footer>
    </div>
  )
}
