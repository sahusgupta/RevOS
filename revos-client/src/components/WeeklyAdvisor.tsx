import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  BookOpen,
  Target,
  TrendingUp,
  Loader2,
  Zap,
  Award,
} from 'lucide-react';
import { GlassPanel } from './GlassPanel';
import { Button } from './ui/button';

interface Assignment {
  course: string;
  title: string;
  date: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
}

interface CalendarEvent {
  title: string;
  start: string;
  end?: string;
  description?: string;
  busy?: boolean;
}

interface WeeklyData {
  weekStart: string;
  weekEnd: string;
  assignments: Assignment[];
  calendarEvents: CalendarEvent[];
  weeklyReview: string;
  courseCount: number;
  assignmentCount: number;
  eventCount: number;
}

interface WeeklyAdvisorProps {
  authToken?: string;
  apiBaseUrl?: string;
}

export function WeeklyAdvisor({ authToken, apiBaseUrl = 'http://localhost:5000' }: WeeklyAdvisorProps) {
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    if (authToken) {
      fetchWeeklyData();
    }
  }, [authToken]);

  const fetchWeeklyData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${apiBaseUrl}/api/weekly-advisor`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch weekly data');
      }

      const data = await response.json();
      setWeeklyData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load weekly advisor');
      console.error('Error fetching weekly data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateLong = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return { bg: 'bg-red-500/10', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300' };
      case 'medium':
        return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300' };
      case 'low':
        return { bg: 'bg-green-500/10', text: 'text-green-400', badge: 'bg-green-500/20 text-green-300' };
      default:
        return { bg: 'bg-gray-500/10', text: 'text-gray-400', badge: 'bg-gray-500/20 text-gray-300' };
    }
  };

  const getWorkloadEmoji = (count: number) => {
    if (count > 5) return '🔥';
    if (count > 2) return '⚡';
    return '✨';
  };

  const parseReviewSections = (review: string) => {
    const slides = [];
    const parts = review.split(/^## /m);
    
    for (const part of parts) {
      if (!part.trim()) continue;
      
      const lines = part.split('\n');
      const title = lines[0].trim();
      const content = lines.slice(1).join('\n').trim();
      
      let emoji = '📋';
      if (title.includes('Overview')) emoji = '📊';
      else if (title.includes('Priority')) emoji = '🎯';
      else if (title.includes('Time')) emoji = '⏰';
      else if (title.includes('Study')) emoji = '📚';
      else if (title.includes('Risk')) emoji = '⚠️';
      else if (title.includes('Motivation') || title.includes('Encouragement')) emoji = '💪';
      
      // Split content into bullet points for better readability
      const items = content
        .split('\n')
        .filter(line => line.trim())
        .slice(0, 3); // Limit to 3 items per slide
      
      if (items.length > 0) {
        slides.push({ title, emoji, items, fullContent: content });
      }
    }
    
    return slides;
  };

  const reviewSlides = weeklyData ? parseReviewSections(weeklyData.weeklyReview) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Loader2 className="w-10 h-10 text-secondary" />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <GlassPanel className="p-8 border-red-600/30 rounded-2xl">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-foreground font-bold text-lg mb-2">Error Loading Weekly Advisor</h3>
            <p className="text-foreground/60 mb-4">{error}</p>
            <Button
              onClick={fetchWeeklyData}
              className="bg-[#500000] hover:bg-[#8B0000]"
            >
              Try Again
            </Button>
          </div>
        </div>
      </GlassPanel>
    );
  }

  if (!weeklyData) {
    return null;
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">📋 Weekly Planner</h1>
              <p className="text-foreground/60 text-lg">
                {formatDateLong(weeklyData.weekStart)} → {formatDateLong(weeklyData.weekEnd)}
              </p>
            </div>
            <Button
              onClick={fetchWeeklyData}
              disabled={isLoading}
              className="bg-[#500000] hover:bg-[#8B0000] rounded-xl px-6 py-2"
            >
              🔄 Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Courses Card */}
        <motion.div
          whileHover={{ translateY: -4 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <GlassPanel className="p-5 rounded-2xl border-l-4 border-[#CFAF5A] hover:border-[#500000] transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground/60 text-sm font-medium">📚 Courses</p>
                <p className="text-3xl font-bold text-[#CFAF5A] mt-2">{weeklyData.courseCount}</p>
              </div>
              <BookOpen className="w-10 h-10 text-[#CFAF5A]/40" />
            </div>
          </GlassPanel>
        </motion.div>

        {/* Assignments Card */}
        <motion.div
          whileHover={{ translateY: -4 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.05 }}
        >
          <GlassPanel className="p-5 rounded-2xl border-l-4 border-green-500 hover:border-[#500000] transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground/60 text-sm font-medium">✅ Assignments</p>
                <p className="text-3xl font-bold text-green-400 mt-2">{weeklyData.assignmentCount}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500/40" />
            </div>
          </GlassPanel>
        </motion.div>

        {/* Events Card */}
        <motion.div
          whileHover={{ translateY: -4 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
        >
          <GlassPanel className="p-5 rounded-2xl border-l-4 border-blue-500 hover:border-[#500000] transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground/60 text-sm font-medium">📅 Events</p>
                <p className="text-3xl font-bold text-blue-400 mt-2">{weeklyData.eventCount}</p>
              </div>
              <Calendar className="w-10 h-10 text-blue-500/40" />
            </div>
          </GlassPanel>
        </motion.div>

        {/* Workload Card */}
        <motion.div
          whileHover={{ translateY: -4 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.15 }}
        >
          <GlassPanel className="p-5 rounded-2xl border-l-4 border-purple-500 hover:border-[#500000] transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground/60 text-sm font-medium">⚡ Workload</p>
                <p className="text-2xl font-bold text-purple-400 mt-2">
                  {getWorkloadEmoji(weeklyData.assignmentCount)} {' '}
                  {weeklyData.assignmentCount > 5 ? 'Heavy' : weeklyData.assignmentCount > 2 ? 'Medium' : 'Light'}
                </p>
              </div>
              <Zap className="w-10 h-10 text-purple-500/40" />
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>

      {/* Assignments Section */}
      {weeklyData.assignments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <GlassPanel className="p-8 rounded-2xl border-t-2 border-[#500000]">
            <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Target className="w-6 h-6 text-[#500000]" />
              This Week's Tasks
            </h2>
            <p className="text-foreground/60 text-sm mb-6">Manage your deadlines with priority tracking</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weeklyData.assignments.map((assignment, idx) => {
                const colors = getPriorityColor(assignment.priority);
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className={`p-5 rounded-xl border border-[#500000]/20 ${colors.bg} hover:border-[#500000]/40 transition-all cursor-pointer`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-foreground font-semibold mb-2">{assignment.title}</h3>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs px-3 py-1 rounded-full bg-[#500000]/20 text-[#CFAF5A]">
                            {assignment.course}
                          </span>
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${colors.badge}`}>
                            {assignment.priority.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-foreground/70 text-sm">
                          <Clock className="w-4 h-4" />
                          {formatDate(assignment.date)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </GlassPanel>
        </motion.div>
      )}

      {/* Weekly Review Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <GlassPanel className="p-8 rounded-2xl border-t-2 border-[#CFAF5A]">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Award className="w-6 h-6 text-[#CFAF5A]" />
            Rev's Weekly Assessment
          </h2>
          
          {reviewSlides.length > 0 ? (
            <div className="space-y-4">
              {/* Carousel Container */}
              <div className="relative">
                <motion.div
                  key={carouselIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gradient-to-br from-[#500000]/5 to-[#CFAF5A]/5 rounded-xl border border-[#CFAF5A]/40 p-6 min-h-[280px] max-h-[320px] flex flex-col justify-between"
                >
                  {/* Section Header */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">{reviewSlides[carouselIndex].emoji}</span>
                      <h3 className="text-lg font-bold text-[#CFAF5A]">
                        {reviewSlides[carouselIndex].title}
                      </h3>
                    </div>

                    {/* Section Content - Compact */}
                    <div className="space-y-2">
                      {reviewSlides[carouselIndex].items.map((item, idx) => (
                        <div key={idx} className="flex gap-2 text-xs md:text-sm text-foreground/90">
                          <span className="text-[#CFAF5A] font-bold flex-shrink-0">•</span>
                          <span className="line-clamp-2">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Carousel Navigation */}
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => setCarouselIndex((prev) => (prev === 0 ? reviewSlides.length - 1 : prev - 1))}
                  className="p-2 rounded-lg bg-[#CFAF5A]/20 hover:bg-[#CFAF5A]/40 text-[#CFAF5A] transition-all font-bold text-lg"
                >
                  ←
                </button>

                {/* Progress Dots */}
                <div className="flex items-center gap-2">
                  {reviewSlides.map((_, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => setCarouselIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === carouselIndex
                          ? 'w-8 bg-[#CFAF5A]'
                          : 'w-2 bg-[#CFAF5A]/40 hover:bg-[#CFAF5A]/60'
                      }`}
                      whileHover={{ scale: 1.2 }}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setCarouselIndex((prev) => (prev === reviewSlides.length - 1 ? 0 : prev + 1))}
                  className="p-2 rounded-lg bg-[#CFAF5A]/20 hover:bg-[#CFAF5A]/40 text-[#CFAF5A] transition-all font-bold text-lg"
                >
                  →
                </button>
              </div>

              {/* Section Counter */}
              <div className="text-center text-foreground/60 text-sm">
                Section {carouselIndex + 1} of {reviewSlides.length}
              </div>
            </div>
          ) : (
            <p className="text-foreground/60">Loading assessment...</p>
          )}
        </GlassPanel>
      </motion.div>

      {/* Calendar Events Section */}
      {weeklyData.calendarEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <GlassPanel className="p-8 rounded-2xl border-t-2 border-blue-500">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-500" />
              Scheduled Events
            </h2>
            <div className="space-y-3">
              {weeklyData.calendarEvents.map((event, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 transition-colors"
                >
                  <div className="flex-shrink-0 pt-1">
                    <Calendar className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground font-semibold">{event.title}</p>
                    {event.description && (
                      <p className="text-foreground/60 text-sm mt-1">{event.description}</p>
                    )}
                    <p className="text-foreground/50 text-xs mt-2">{formatDate(event.start)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassPanel>
        </motion.div>
      )}
    </div>
  );
}
