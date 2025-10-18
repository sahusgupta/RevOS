import { GlassPanel } from './GlassPanel';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Send, Sparkles, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

interface Message {
  id: number;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

export function AskRev() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'ai',
      content: "Howdy! I'm Rev, your AI study companion. I can help you plan your schedule, understand difficult concepts, or optimize your study habits. What can I help you with today?",
      timestamp: '10:30 AM',
      suggestions: [
        'Help me study for CSCE 314',
        'What assignments are due this week?',
        'Create a study plan',
        'Budget recommendations'
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    };

    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        type: 'ai',
        content: getAIResponse(inputValue),
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        suggestions: ['Tell me more', 'What else?', 'Thanks!']
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getAIResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('study') || lowerInput.includes('csce')) {
      return "For CSCE 314, I recommend focusing on functional programming concepts. Based on your syllabus, you have an exam coming up on October 25th. Let me create a study schedule: \n\n📚 Week 1: Review Haskell basics and type systems\n📚 Week 2: Practice recursion and higher-order functions\n📚 Week 3: Review past assignments and practice problems\n\nWould you like me to block time on your calendar?";
    } else if (lowerInput.includes('assignment') || lowerInput.includes('due')) {
      return "You have 4 assignments due this week:\n\n1. CSCE 314 Assignment 3 - Today, 11:59 PM\n2. MATH 308 Quiz - Tomorrow, 2:00 PM\n3. ENGR 216 Lab Report - Oct 20, 5:00 PM\n4. Review Lecture Notes - Oct 22\n\nI notice you're on track with most of them! Need help prioritizing?";
    } else if (lowerInput.includes('budget')) {
      return "Based on your spending patterns, you have $342 left for the month. Here's my recommendation:\n\n💰 Groceries: $150 remaining budget\n💰 Entertainment: $100 (you're doing great!)\n💰 Emergency fund: $92\n\nYou're spending 8% more on dining out this month. Consider meal prepping to save $50-75!";
    } else if (lowerInput.includes('plan') || lowerInput.includes('schedule')) {
      return "I've analyzed your syllabus and current commitments. Here's an optimized study plan:\n\n🎯 Morning (8-11 AM): High-focus tasks like CSCE assignments\n🎯 Afternoon (2-5 PM): Lecture review and practice problems\n🎯 Evening (7-9 PM): Group study or lighter tasks\n\nThis aligns with your peak productivity hours. Want me to add this to your calendar?";
    }
    return "That's a great question! Based on your academic profile and current goals, I can help you optimize your schedule and study strategies. Would you like me to analyze your syllabus, create a custom study plan, or help with time management?";
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  return (
    <div className="h-full flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 rounded-2xl gradient-maroon glow-maroon flex items-center justify-center"
          >
            <Sparkles className="w-6 h-6 text-[#CFAF5A]" />
          </motion.div>
          <div>
            <h1 className="text-white">Ask Rev</h1>
            <p className="text-white/60">Your AI-powered Aggie assistant</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Badge className="bg-[#CFAF5A]/20 text-[#CFAF5A] border-[#CFAF5A]">Syllabus Analysis</Badge>
          <Badge className="bg-[#CFAF5A]/20 text-[#CFAF5A] border-[#CFAF5A]">Study Planning</Badge>
          <Badge className="bg-[#CFAF5A]/20 text-[#CFAF5A] border-[#CFAF5A]">Budget Help</Badge>
        </div>
      </motion.div>

      <GlassPanel glow="maroon" className="flex-1 flex flex-col max-h-[calc(100vh-300px)]">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    message.type === 'ai' 
                      ? 'gradient-maroon glow-maroon' 
                      : 'bg-[#CFAF5A] glow-gold'
                  }`}>
                    {message.type === 'ai' ? (
                      <Bot className="w-5 h-5 text-white" />
                    ) : (
                      <User className="w-5 h-5 text-[#500000]" />
                    )}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${message.type === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`p-4 rounded-2xl ${
                      message.type === 'ai' 
                        ? 'glass-card' 
                        : 'bg-[#500000] glow-maroon'
                    }`}>
                      <p className="text-white whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <span className="text-white/40 mt-1 px-2">{message.timestamp}</span>
                    
                    {message.suggestions && message.type === 'ai' && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {message.suggestions.map((suggestion, i) => (
                          <motion.button
                            key={i}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="px-3 py-1.5 rounded-lg glass-card text-[#CFAF5A] hover:bg-[#CFAF5A]/10 transition-colors border border-[#CFAF5A]/30"
                          >
                            {suggestion}
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-10 h-10 rounded-xl gradient-maroon glow-maroon flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="glass-card p-4 rounded-2xl">
                  <div className="flex gap-2">
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 rounded-full bg-[#CFAF5A]"
                    />
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 rounded-full bg-[#CFAF5A]"
                    />
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 rounded-full bg-[#CFAF5A]"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        <div className="mt-4 flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Rev anything..."
            className="flex-1 bg-white/5 border-[#CFAF5A]/30 text-white placeholder:text-white/40 focus:border-[#CFAF5A] focus:ring-[#CFAF5A]"
          />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleSend}
              className="gradient-maroon glow-maroon hover:opacity-90"
            >
              <Send className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </GlassPanel>
    </div>
  );
}
