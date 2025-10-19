import { GlassPanel } from './GlassPanel';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Send, Bot, User, BookOpen, Calendar, MapPin, Zap, Loader } from 'lucide-react';
import { RevLogo } from './RevLogo';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: number;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

interface AskRevProps {
  authToken?: string;
  apiBaseUrl?: string;
}

export function AskRev({ authToken, apiBaseUrl = 'http://localhost:5000' }: AskRevProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'ai',
      content: "Howdy! I'm Rev, your AI study companion. I can help you with:\n\n📝 **Worksheets** - Generate practice problems\n📚 **Study Plans** - Get personalized study schedules\n📍 **Campus Tips** - Find places to eat, study, or explore\n❓ **Any Question** - Ask me anything about your courses\n\nWhat can I help you with today?",
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      suggestions: [
        'Generate a worksheet on derivatives',
        'Create a study plan for my midterm',
        'Where should I study on campus?',
        'Ask me anything'
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!inputValue.trim() || !authToken) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const aiResponse = await getSmartAIResponse(inputValue, authToken);
      const response: Message = {
        id: messages.length + 2,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        suggestions: generateContextualSuggestions(inputValue)
      };
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorResponse: Message = {
        id: messages.length + 2,
        type: 'ai',
        content: "I encountered an issue processing your request. Please try again!",
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateContextualSuggestions = (userInput: string): string[] => {
    const lower = userInput.toLowerCase();
    
    if (lower.includes('worksheet') || lower.includes('practice')) {
      return ['Make it harder', 'Add more questions', 'Focus on solutions'];
    } else if (lower.includes('study plan') || lower.includes('exam')) {
      return ['Adjust the timeline', 'Add more resources', 'Give me tips'];
    } else if (lower.includes('eat') || lower.includes('dining') || lower.includes('food')) {
      return ['Show vegetarian options', 'Budget-friendly places', 'Tell me more'];
    } else {
      return ['Tell me more', 'How do I apply this?', 'Next steps?'];
    }
  };

  const getSmartAIResponse = async (input: string, token: string): Promise<string> => {
    const lowerInput = input.toLowerCase();

    // WORKSHEET GENERATION
    if (lowerInput.includes('worksheet') || lowerInput.includes('practice') || lowerInput.includes('problems')) {
      try {
        const topic = input.replace(/.*worksheet.*on\s+/i, '').replace(/.*practice.*on\s+/i, '').trim() || 'General Review';
        const difficulty = lowerInput.includes('hard') || lowerInput.includes('advanced') ? 'hard' 
                          : lowerInput.includes('easy') || lowerInput.includes('beginner') ? 'easy' 
                          : 'medium';
        
        const response = await fetch(`${apiBaseUrl}/api/ask-rev/generate-worksheet`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic,
            difficulty,
            numQuestions: lowerInput.includes('many') ? 10 : 5,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const worksheet = data.worksheet;
          let result = `# 📝 ${worksheet.title}\n\n`;
          result += `**Difficulty:** ${worksheet.difficulty.toUpperCase()}\n\n`;
          result += `**Instructions:** ${worksheet.instructions}\n\n`;
          result += `---\n\n`;
          worksheet.questions.forEach((q: any, idx: number) => {
            result += `## Question ${idx + 1} (${q.points} points)\n\n${q.question}\n\n`;
            if (q.options) {
              result += q.options.map((opt: string, i: number) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n') + '\n\n';
            }
          });
          return result;
        }
      } catch (error) {
        console.error('Error generating worksheet:', error);
      }
    }

    // STUDY PLAN GENERATION
    if (lowerInput.includes('study plan') || lowerInput.includes('prepare') || lowerInput.includes('exam') || lowerInput.includes('midterm')) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/ask-rev/generate-study-plan`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseId: null,
            courseName: input.match(/for\s+(\w+)/)?.[1] || 'your course',
            examDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            currentTopics: [],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const plan = data.studyPlan;
          let result = `# 📚 Study Plan for ${plan.courseName}\n\n`;
          result += `**Overall Strategy:** ${plan.overallStrategy}\n\n`;
          
          if (plan.priorityTopics && plan.priorityTopics.length > 0) {
            result += `## 🎯 Priority Topics\n\n`;
            plan.priorityTopics.forEach((topic: any) => {
              result += `### ${topic.name} (${topic.priority})\n`;
              result += `- **Estimated Time:** ${topic.estimatedHours}h\n`;
              result += `- **Key Points:** ${topic.keyPoints?.join(', ')}\n\n`;
            });
          }
          
          if (plan.dailySchedule && plan.dailySchedule.length > 0) {
            result += `## ⏰ Daily Schedule\n\n`;
            plan.dailySchedule.forEach((day: any) => {
              result += `**${day.day}:** ${day.focus}\n`;
            });
            result += `\n`;
          }
          
          if (plan.studyTips && plan.studyTips.length > 0) {
            result += `## ✓ Study Tips\n\n`;
            plan.studyTips.forEach((tip: string) => {
              result += `- ${tip}\n`;
            });
          }
          
          return result;
        }
      } catch (error) {
        console.error('Error generating study plan:', error);
      }
    }

    // CAMPUS RECOMMENDATIONS
    if (lowerInput.includes('eat') || lowerInput.includes('dining') || lowerInput.includes('food') || 
        lowerInput.includes('study spot') || lowerInput.includes('library') || 
        lowerInput.includes('explore') || lowerInput.includes('recreation') || lowerInput.includes('where')) {
      try {
        let category: string = 'explore';
        if (lowerInput.includes('eat') || lowerInput.includes('dining') || lowerInput.includes('food')) {
          category = 'dining';
        } else if (lowerInput.includes('study') || lowerInput.includes('library')) {
          category = 'study';
        } else if (lowerInput.includes('recreation') || lowerInput.includes('exercise')) {
          category = 'recreation';
        }

        const response = await fetch(
          `${apiBaseUrl}/api/ask-rev/campus-recommendations?category=${category}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const recs = data.recommendations;
          let result = `# 🎓 Best Places for ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
          recs.forEach((rec: any, idx: number) => {
            result += `## ${idx + 1}. ${rec.name}\n\n`;
            result += `📍 **Location:** ${rec.location} (${rec.distance})\n`;
            result += `⭐ **Rating:** ${rec.rating}/5\n`;
            result += `📝 **Description:** ${rec.description}\n`;
            if (rec.hours) result += `🕐 **Hours:** ${rec.hours}\n`;
            result += `✨ **Why we recommend it:** ${rec.whyRecommended}\n\n`;
          });
          return result;
        }
      } catch (error) {
        console.error('Error getting recommendations:', error);
      }
    }

    // GENERAL QUESTION - USE OPENAI WITH SYLLABUS CONTEXT
    try {
      const response = await fetch(`${apiBaseUrl}/api/ask-rev/ask-question`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: input }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.answer;
      } else {
        const error = await response.json();
        return `I couldn't process that right now: ${error.error || 'Unknown error'}`;
      }
    } catch (error) {
      console.error('Error asking question:', error);
      return 'Let me try a different approach...';
    }
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
          <div className="w-12 h-12 rounded-2xl gradient-maroon glow-maroon flex items-center justify-center p-2">
            <RevLogo size="lg" className="text-secondary" />
          </div>
          <div>
            <h1 className="text-foreground">Ask Rev</h1>
            <p className="text-muted-foreground">Your AI-powered Aggie assistant</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          <Badge className="bg-secondary/20 text-secondary border-secondary gap-1">
            <BookOpen className="w-3 h-3" /> Worksheets
          </Badge>
          <Badge className="bg-secondary/20 text-secondary border-secondary gap-1">
            <Zap className="w-3 h-3" /> Study Plans
          </Badge>
          <Badge className="bg-secondary/20 text-secondary border-secondary gap-1">
            <MapPin className="w-3 h-3" /> Campus Tips
          </Badge>
          <Badge className="bg-secondary/20 text-secondary border-secondary gap-1">
            <Calendar className="w-3 h-3" /> Smart Answers
          </Badge>
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
                      : 'bg-secondary glow-gold'
                  }`}>
                    {message.type === 'ai' ? (
                      <Bot className="w-5 h-5 text-primary-foreground" />
                    ) : (
                      <User className="w-5 h-5 text-secondary-foreground" />
                    )}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${message.type === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`p-4 rounded-2xl ${
                      message.type === 'ai' 
                        ? 'glass-card' 
                        : 'bg-primary glow-maroon'
                    }`}>
                      {message.type === 'ai' ? (
                        <div className="text-foreground prose prose-invert max-w-none text-sm">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-2 mb-2" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-base font-bold mt-2 mb-2" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-sm font-bold mt-2 mb-1" {...props} />,
                              p: ({node, ...props}) => <p className="mb-2" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2" {...props} />,
                              li: ({node, ...props}) => <li className="mb-1" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                              em: ({node, ...props}) => <em className="italic" {...props} />,
                              code: ({node, ...props}) => <code className="bg-white/10 px-2 py-1 rounded text-xs" {...props} />,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-primary-foreground whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                    <span className="text-muted-foreground mt-1 px-2">{message.timestamp}</span>
                    
                    {message.suggestions && message.type === 'ai' && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {message.suggestions.map((suggestion, i) => (
                          <motion.button
                            key={i}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="px-3 py-1.5 rounded-lg glass-card text-secondary hover:bg-secondary/10 transition-colors border border-secondary/30 text-sm"
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
                <div className="w-10 h-10 rounded-xl gradient-maroon glow-maroon flex items-center justify-center flex-shrink-0">
                  <Loader className="w-5 h-5 text-primary-foreground animate-spin" />
                </div>
                <div className="glass-card p-4 rounded-2xl flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">Rev is thinking</span>
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-secondary"
                  />
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
            className="flex-1 bg-white/5 border-secondary/30 text-foreground placeholder:text-muted-foreground focus:border-secondary focus:ring-secondary"
          />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleSend}
              className="gradient-maroon glow-maroon hover:opacity-90"
              disabled={!authToken || isTyping}
            >
              <Send className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </GlassPanel>
    </div>
  );
}
