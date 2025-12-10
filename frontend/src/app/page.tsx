import Link from 'next/link'
import { Brain, Mic, Video, Type, BarChart3, Lock, Zap, TrendingUp, Activity, Sparkles, ArrowRight, Check, Heart, Shield, Cpu, Eye } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 z-50 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">EmotionAI</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-black transition-colors">Features</a>
            <a href="#ml-models" className="text-gray-600 hover:text-black transition-colors">ML Models</a>
            <a href="#analytics" className="text-gray-600 hover:text-black transition-colors">Analytics</a>
          </nav>
          
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-8 md:py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">95% accuracy with advanced ML models</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Understand Your
            <br />
            <span className="bg-gradient-to-r from-gray-700 via-gray-900 to-black bg-clip-text text-transparent">
              Emotions with AI
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Multi-modal emotion detection from text, voice, and video. Transform your mental wellness journey with machine learning.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/signup" className="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/check-in/new" className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-800 font-medium rounded-lg hover:border-gray-400 transition-colors">
              Try Live Demo
            </Link>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Free forever</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Privacy-first</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-black text-white py-12 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-gray-400 text-sm">ML Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">16</div>
              <div className="text-gray-400 text-sm">Emotions Detected</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">3</div>
              <div className="text-gray-400 text-sm">Input Modalities</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-gray-400 text-sm">AI Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Multi-modal <span className="bg-gradient-to-r from-gray-700 to-black bg-clip-text text-transparent">Detection</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Advanced ML models analyze your emotions across different input types with industry-leading accuracy
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="group p-6 bg-white border border-gray-200 rounded-lg hover:border-black hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Type className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Text Analysis</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Our NLP model achieves <span className="font-semibold text-black">94.7% accuracy</span> in detecting emotions from written journal entries using BERT-based classification.
            </p>
            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg inline-block">
              BERT-based • 8 emotion classes
            </div>
          </div>
          
          <div className="group p-6 bg-white border border-gray-200 rounded-lg hover:border-black hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-black rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Voice Sentiment</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Analyze tone, pitch, and speech patterns with <span className="font-semibold text-black">89.2% accuracy</span> using advanced audio CNN architecture.
            </p>
            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg inline-block">
              Audio CNN • 6 emotion classes
            </div>
          </div>
          
          <div className="group p-6 bg-white border border-gray-200 rounded-lg hover:border-black hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-black rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Video className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Facial Expression</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Real-time facial emotion recognition with <span className="font-semibold text-black">93.4% accuracy</span> using ResNet-50 computer vision.
            </p>
            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg inline-block">
              ResNet-50 • 7 emotion classes
            </div>
          </div>
        </div>
      </section>

      {/* ML Models Section */}
      <section id="ml-models" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm mb-4">
              <Cpu className="w-4 h-4" />
              <span className="font-medium">State-of-the-art Deep Learning</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Powered by Advanced <span className="bg-gradient-to-r from-gray-700 to-black bg-clip-text text-transparent">ML</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Validated on 50K+ samples with industry-leading performance
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-lg border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Model Performance</h3>
                  <p className="text-sm text-gray-600">Validated on 50K+ samples</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700">Text Emotion Classifier</span>
                    <span className="font-semibold">94.7%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-gray-700 to-black rounded-full" style={{ width: '94.7%' }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700">Facial Expression Recognition</span>
                    <span className="font-semibold">93.4%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-gray-700 to-black rounded-full" style={{ width: '93.4%' }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700">Voice Sentiment Analyzer</span>
                    <span className="font-semibold">89.2%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-gray-700 to-black rounded-full" style={{ width: '89.2%' }} />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-lg border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-black rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Real-time Processing</h3>
                  <p className="text-sm text-gray-600">Low-latency inference</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Type className="w-4 h-4" />
                    <span className="text-sm font-medium">Text Analysis</span>
                  </div>
                  <span className="font-semibold text-sm">~234ms</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Mic className="w-4 h-4" />
                    <span className="text-sm font-medium">Voice Processing</span>
                  </div>
                  <span className="font-semibold text-sm">~456ms</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Video className="w-4 h-4" />
                    <span className="text-sm font-medium">Video Frame Analysis</span>
                  </div>
                  <span className="font-semibold text-sm">~312ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section id="analytics" className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="pl-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm mb-4">
              <Eye className="w-4 h-4" />
              <span className="font-medium">Powerful Insights</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Visualize Your <span className="bg-gradient-to-r from-gray-700 to-black bg-clip-text text-transparent">Journey</span>
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Transform raw emotion data into actionable insights with advanced analytics and beautiful visualizations.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-0.5">Mood History Charts</h3>
                  <p className="text-xs text-gray-600">Track valence and arousal over time with interactive visualizations and trend analysis</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-black rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-0.5">Pattern Recognition</h3>
                  <p className="text-xs text-gray-600">AI-powered detection of emotional triggers and trends in your mental wellness</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-black rounded-lg flex items-center justify-center flex-shrink-0">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-0.5">AI Recommendations</h3>
                  <p className="text-xs text-gray-600">Personalized coping strategies and wellness tips based on your unique patterns</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Weekly Overview</span>
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {[60, 75, 45, 90, 65, 80, 70].map((height, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="w-full bg-gray-100 rounded overflow-hidden" style={{ height: '100px' }}>
                        <div className="w-full bg-gradient-to-t from-gray-700 to-black rounded" style={{ height: `${height}%`, marginTop: 'auto' }}></div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Average Mood Score</span>
                    <span className="font-bold">7.2/10</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4">Privacy-First Design</h2>
            <p className="text-lg text-gray-600">
              Your emotions are deeply personal. We use military-grade encryption and 
              give you complete control over your data. Period.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-black hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-lg">AES-256 Encryption</h3>
              <p className="text-sm text-gray-600">Bank-level security for all your emotional data</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-black hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-lg">You Choose Storage</h3>
              <p className="text-sm text-gray-600">Local, cloud, or hybrid - you decide</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-black hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-lg">Never Sold</h3>
              <p className="text-sm text-gray-600">Your privacy is not for sale, ever</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="relative overflow-hidden bg-black text-white rounded-lg p-12 text-center border border-gray-800">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gray-700/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gray-700/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to understand your emotions?
            </h2>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of users transforming their mental wellness with AI-powered emotion detection.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="px-8 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/ml-models" className="px-8 py-3 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition-colors font-medium">
                Explore ML Models
              </Link>
            </div>
            
            <p className="text-gray-500 text-sm mt-6">
              No credit card required • Free forever • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold">EmotionAI</span>
              </div>
              <p className="text-sm text-gray-600">AI-powered emotion detection for transforming mental wellness</p>
            </div>
            
            <div>
              <h4 className="font-bold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#features" className="hover:text-black transition-colors">Features</a></li>
                <li><a href="/ml-models" className="hover:text-black transition-colors">ML Models</a></li>
                <li><a href="/check-in/new" className="hover:text-black transition-colors">Live Demo</a></li>
                <li><a href="/dashboard" className="hover:text-black transition-colors">Dashboard</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-black transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-black transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-black transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-black transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/privacy" className="hover:text-black transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-black transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-black transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
            <p>© 2025 EmotionAI. All rights reserved.</p>
            <p className="mt-2 md:mt-0">Built with ❤️ for mental wellness</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
