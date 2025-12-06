'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { apiSendChatMessage, apiGetChatHistory, type ChatMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string | number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  emotion?: string;
}

const SUGGESTED_PROMPTS = [
  "How can I improve my emotional well-being?",
  "What are my most common emotions lately?",
  "Give me coping strategies for stress",
  "Show me my mood patterns",
  "Help me reflect on my day",
];

export default function ChatPage() {
  const { user, getAccessToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI emotional wellness companion. I'm here to help you understand your emotions, provide coping strategies, and support your mental health journey. How are you feeling today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          setIsLoadingHistory(false);
          return;
        }

        const response = await apiGetChatHistory(token, 50);
        
        if (response.messages && response.messages.length > 0) {
          // Convert backend messages to frontend format
          const formattedMessages: Message[] = response.messages.map((msg: ChatMessage) => ({
            id: msg.id,
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.message,
            timestamp: new Date(msg.created_at),
            emotion: msg.emotion_context?.emotion,
          }));
          
          setMessages(formattedMessages);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
        // Don't show error to user, just start with welcome message
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [getAccessToken]);

  const detectEmotion = (text: string): string => {
    const lowerText = text.toLowerCase();
    
    if (/(happy|joy|excited|great|wonderful|amazing|good|love)/i.test(lowerText)) return 'happy';
    if (/(sad|down|unhappy|depressed|cry|tear)/i.test(lowerText)) return 'sad';
    if (/(anxious|worried|nervous|stress|panic|overwhelm)/i.test(lowerText)) return 'anxious';
    if (/(calm|peace|relax|serene|tranquil)/i.test(lowerText)) return 'calm';
    if (/(grateful|thankful|appreciate|blessed)/i.test(lowerText)) return 'grateful';
    
    return 'neutral';
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessageText = input.trim();
    const detectedEmotion = detectEmotion(userMessageText);
    
    // Add user message to UI immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Not authenticated. Please log in again.');
      }

      // Send message to backend
      const response = await apiSendChatMessage(
        token,
        userMessageText,
        undefined, // entry_reference
        { emotion: detectedEmotion } // emotion_context
      );

      // Add AI response to UI
      const assistantMessage: Message = {
        id: response.ai_response.id,
        role: 'assistant',
        content: response.response.message || response.ai_response.message,
        timestamp: new Date(response.ai_response.created_at),
        emotion: detectedEmotion,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Failed to send message:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message. Please try again.';
      setError(errorMessage);
      
      // Show error message in chat
      const errorResponse: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `I'm sorry, I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoadingHistory) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <p className="mt-4 text-sm text-gray-600">Loading chat history...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Page Header */}
      <div className="border-b border-gray-200 p-4 bg-white">
        <h1 className="text-2xl font-bold mb-1">AI Wellness Companion</h1>
        <p className="text-sm text-gray-600">I'm here to provide emotional support. Share your feelings and I'll help you find ways to cope.</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages - Compact */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="max-w-3xl mx-auto space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar - Smaller */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-black text-white' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Message Bubble - Compact */}
              <div className={`flex-1 max-w-xl ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block rounded-xl px-3 py-2 ${
                  message.role === 'user'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-xs leading-relaxed whitespace-pre-line">{message.content}</p>
                </div>
                <div className={`flex items-center gap-1.5 mt-0.5 text-xs text-gray-500 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-xs">{formatTime(message.timestamp)}</span>
                  {message.emotion && message.role === 'assistant' && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      {message.emotion}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator - Compact */}
          {isTyping && (
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-gray-100 rounded-xl px-3 py-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggested Prompts - Compact */}
      {messages.length === 1 && (
        <div className="border-t border-gray-200 p-2 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs text-gray-600 mb-1.5">Try asking:</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <Button
                  key={idx}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs rounded-full"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input - Compact */}
      <div className="border-t border-gray-200 p-2 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Message..."
              className="h-9 text-xs rounded-full"
              disabled={isTyping}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              size="sm"
              className="h-9 w-9 rounded-full p-0"
            >
              {isTyping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
