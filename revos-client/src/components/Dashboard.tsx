import { GlassPanel } from './GlassPanel';
import { Calendar } from './ui/calendar';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { CheckCircle2, Circle, TrendingUp, DollarSign, BookOpen, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

export function Dashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const tasks = [
    { id: 1, title: 'CSCE 314 Assignment 3', completed: false, due: 'Today, 11:59 PM', priority: 'high' },
    { id: 2, title: 'MATH 308 Quiz Prep', completed: true, due: 'Tomorrow, 2:00 PM', priority: 'medium' },
    { id: 3, title: 'ENGR 216 Lab Report', completed: false, due: 'Oct 20, 5:00 PM', priority: 'high' },
    { id: 4, title: 'Review Lecture Notes', completed: false, due: 'Oct 22', priority: 'low' },
  ];

  const insights = [
    { icon: BookOpen, label: 'Study Hours', value: '18.5 hrs', change: '+12%', color: 'text-[#CFAF5A]' },
    { icon: DollarSign, label: 'Budget Left', value: '$342', change: '-8%', color: 'text-green-400' },
    { icon: TrendingUp, label: 'Productivity', value: '87%', change: '+5%', color: 'text-[#CFAF5A]' },
  ];

  const upcomingEvents = [
    { time: '9:00 AM', title: 'CSCE 314 Lecture', location: 'HRBB 113' },
    { time: '2:00 PM', title: 'MATH 308 Office Hours', location: 'Blocker 169' },
    { time: '5:30 PM', title: 'MSC Study Session', location: 'MSC 2400' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-[#CFAF5A] mb-2">Welcome back, Aggie!</h1>
          <p className="text-white/60">Saturday, October 18, 2025</p>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="px-6 py-3 rounded-xl gradient-maroon glow-maroon"
        >
          <p className="text-white">🎓 Current GPA: 3.85</p>
        </motion.div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks Panel */}
        <div className="lg:col-span-2 space-y-6">
          <GlassPanel glow="maroon">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white">Today's Tasks</h2>
              <Badge className="bg-[#CFAF5A] text-[#500000]">4 pending</Badge>
            </div>
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="flex items-start gap-4 p-4 rounded-xl glass-card border-l-4 border-[#CFAF5A] cursor-pointer"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-[#CFAF5A] mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-white/40 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={`text-white ${task.completed ? 'line-through opacity-60' : ''}`}>
                      {task.title}
                    </p>
                    <p className="text-white/60">{task.due}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${
                      task.priority === 'high'
                        ? 'border-red-400 text-red-400'
                        : task.priority === 'medium'
                        ? 'border-[#CFAF5A] text-[#CFAF5A]'
                        : 'border-white/40 text-white/40'
                    }`}
                  >
                    {task.priority}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </GlassPanel>

          {/* Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((insight, index) => (
              <motion.div
                key={insight.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <GlassPanel className="text-center">
                  <insight.icon className={`w-8 h-8 mx-auto mb-3 ${insight.color}`} />
                  <p className="text-white/60 mb-1">{insight.label}</p>
                  <h3 className="text-white mb-1">{insight.value}</h3>
                  <p className={`${insight.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {insight.change} this week
                  </p>
                </GlassPanel>
              </motion.div>
            ))}
          </div>

          {/* Weekly Progress */}
          <GlassPanel>
            <h3 className="text-white mb-4">Weekly Progress</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-white/80">Assignments Completed</span>
                  <span className="text-[#CFAF5A]">7/10</span>
                </div>
                <Progress value={70} className="h-2 bg-white/10" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-white/80">Study Goals</span>
                  <span className="text-[#CFAF5A]">15/20 hrs</span>
                </div>
                <Progress value={75} className="h-2 bg-white/10" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-white/80">Budget Usage</span>
                  <span className="text-[#CFAF5A]">$658/$1000</span>
                </div>
                <Progress value={65.8} className="h-2 bg-white/10" />
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Calendar */}
          <GlassPanel glow="gold">
            <h3 className="text-white mb-4">Calendar</h3>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-lg border-0"
            />
          </GlassPanel>

          {/* Upcoming Events */}
          <GlassPanel>
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="w-5 h-5 text-[#CFAF5A]" />
              <h3 className="text-white">Today's Schedule</h3>
            </div>
            <div className="space-y-3">
              {upcomingEvents.map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="p-3 rounded-lg glass-card"
                >
                  <p className="text-[#CFAF5A]">{event.time}</p>
                  <p className="text-white mt-1">{event.title}</p>
                  <p className="text-white/60">{event.location}</p>
                </motion.div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
