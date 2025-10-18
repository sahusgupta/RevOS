import { GlassPanel } from './GlassPanel';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Sparkles, TrendingUp, Target, Brain, Clock, Award, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export function WeeklyAdvisor() {
  const weekSummary = {
    productivityScore: 87,
    studyHours: 18.5,
    assignmentsCompleted: 7,
    goalsAchieved: 5,
    streak: 12,
  };

  const recommendations = [
    {
      icon: Brain,
      title: 'Optimize Study Schedule',
      description: 'Your peak productivity is between 9 AM - 12 PM. Schedule CSCE 314 work during these hours.',
      priority: 'high',
      impact: '+15% efficiency'
    },
    {
      icon: Clock,
      title: 'Time Management',
      description: 'You spent 3.5 hours on social media this week. Consider using the Pomodoro technique.',
      priority: 'medium',
      impact: 'Save 2+ hours/week'
    },
    {
      icon: Target,
      title: 'Upcoming Deadlines',
      description: 'MATH 308 exam in 7 days. Start reviewing Chapter 5-7 this weekend.',
      priority: 'high',
      impact: 'Avoid cramming'
    },
    {
      icon: Award,
      title: 'Budget Opportunity',
      description: 'You can save $75/month by meal prepping. Here\'s a custom plan based on your preferences.',
      priority: 'low',
      impact: '$900/year savings'
    },
  ];

  const weeklyGoals = [
    { goal: 'Complete all assignments on time', progress: 100, status: 'complete' },
    { goal: 'Study 20 hours', progress: 92.5, status: 'in-progress' },
    { goal: 'Stay under budget', progress: 65, status: 'in-progress' },
    { goal: 'Exercise 3 times', progress: 66, status: 'in-progress' },
  ];

  const achievements = [
    { title: '7-Day Streak', description: 'Completed all tasks for a week', icon: '🔥' },
    { title: 'Budget Master', description: 'Stayed under budget', icon: '💰' },
    { title: 'Early Bird', description: 'Submitted 3 assignments early', icon: '🎯' },
  ];

  const upcomingWeek = [
    { day: 'Monday', focus: 'CSCE 314 - Haskell Functions', hours: 3, priority: 'high' },
    { day: 'Tuesday', focus: 'MATH 308 - Linear Algebra Review', hours: 2.5, priority: 'high' },
    { day: 'Wednesday', focus: 'ENGR 216 - Lab Prep', hours: 2, priority: 'medium' },
    { day: 'Thursday', focus: 'CSCE 314 - Assignment 4', hours: 4, priority: 'high' },
    { day: 'Friday', focus: 'Review Week & Catch Up', hours: 2, priority: 'low' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-2xl gradient-maroon glow-maroon flex items-center justify-center"
        >
          <Sparkles className="w-8 h-8 text-[#CFAF5A]" />
        </motion.div>
        <div>
          <h1 className="text-white mb-1">Weekly Advisor Report</h1>
          <p className="text-white/60">Week of October 14-18, 2025 • Personalized insights from Rev</p>
        </div>
      </motion.div>

      {/* Performance Summary */}
      <GlassPanel glow="maroon" className="gradient-maroon">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white">This Week's Performance</h2>
          <Badge className="bg-[#CFAF5A] text-[#500000]">
            Week 8 of 16
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center p-4 rounded-xl glass-card"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-12 h-12 mx-auto mb-2 rounded-xl bg-[#CFAF5A] flex items-center justify-center"
            >
              <TrendingUp className="w-6 h-6 text-[#500000]" />
            </motion.div>
            <h3 className="text-white">{weekSummary.productivityScore}</h3>
            <p className="text-white/60">Score</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center p-4 rounded-xl glass-card"
          >
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-white/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#CFAF5A]" />
            </div>
            <h3 className="text-white">{weekSummary.studyHours}</h3>
            <p className="text-white/60">Hours</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center p-4 rounded-xl glass-card"
          >
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-white/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-[#CFAF5A]" />
            </div>
            <h3 className="text-white">{weekSummary.assignmentsCompleted}</h3>
            <p className="text-white/60">Tasks</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center p-4 rounded-xl glass-card"
          >
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-white/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-[#CFAF5A]" />
            </div>
            <h3 className="text-white">{weekSummary.goalsAchieved}</h3>
            <p className="text-white/60">Goals</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center p-4 rounded-xl glass-card"
          >
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-white/10 flex items-center justify-center text-[#CFAF5A]">
              🔥
            </div>
            <h3 className="text-white">{weekSummary.streak}</h3>
            <p className="text-white/60">Day Streak</p>
          </motion.div>
        </div>
      </GlassPanel>

      {/* AI Recommendations */}
      <div>
        <h2 className="text-white mb-4">Rev's Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec, index) => {
            const Icon = rec.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <GlassPanel
                  glow={rec.priority === 'high' ? 'gold' : 'none'}
                  className={rec.priority === 'high' ? 'border-l-4 border-[#CFAF5A]' : ''}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      rec.priority === 'high' 
                        ? 'gradient-maroon glow-maroon' 
                        : 'bg-white/10'
                    }`}>
                      <Icon className="w-6 h-6 text-[#CFAF5A]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-white">{rec.title}</h3>
                        <Badge
                          className={
                            rec.priority === 'high'
                              ? 'bg-red-500/20 text-red-400'
                              : rec.priority === 'medium'
                              ? 'bg-[#CFAF5A]/20 text-[#CFAF5A]'
                              : 'bg-blue-500/20 text-blue-400'
                          }
                        >
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-white/70 mb-2">{rec.description}</p>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">{rec.impact}</span>
                      </div>
                    </div>
                  </div>
                </GlassPanel>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Weekly Goals Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassPanel>
          <h3 className="text-white mb-4">Weekly Goals Progress</h3>
          <div className="space-y-4">
            {weeklyGoals.map((goal, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {goal.status === 'complete' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-[#CFAF5A]" />
                    )}
                    <span className="text-white">{goal.goal}</span>
                  </div>
                  <span className="text-[#CFAF5A]">{goal.progress}%</span>
                </div>
                <Progress value={goal.progress} className="h-2 bg-white/10" />
              </motion.div>
            ))}
          </div>
        </GlassPanel>

        {/* Achievements */}
        <GlassPanel glow="gold">
          <h3 className="text-white mb-4">🏆 This Week's Achievements</h3>
          <div className="space-y-3">
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-4 p-3 rounded-xl glass-card cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl gradient-maroon glow-maroon flex items-center justify-center">
                  <span className="text-2xl">{achievement.icon}</span>
                </div>
                <div>
                  <h4 className="text-white">{achievement.title}</h4>
                  <p className="text-white/60">{achievement.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* Next Week Preview */}
      <GlassPanel>
        <h3 className="text-white mb-4">📅 Next Week's Study Plan</h3>
        <div className="space-y-3">
          {upcomingWeek.map((day, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.7 + index * 0.1 }}
              className={`p-4 rounded-xl glass-card ${
                day.priority === 'high' ? 'border-l-4 border-[#CFAF5A]' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[#CFAF5A]">{day.day}</span>
                    <Badge
                      variant="outline"
                      className={
                        day.priority === 'high'
                          ? 'border-red-400 text-red-400'
                          : day.priority === 'medium'
                          ? 'border-[#CFAF5A] text-[#CFAF5A]'
                          : 'border-white/40 text-white/40'
                      }
                    >
                      {day.priority}
                    </Badge>
                  </div>
                  <p className="text-white">{day.focus}</p>
                </div>
                <div className="text-right">
                  <p className="text-white">{day.hours} hrs</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassPanel>

      {/* Overall Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2 }}
      >
        <GlassPanel glow="maroon" className="gradient-maroon">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#CFAF5A] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-[#500000]" />
            </div>
            <div className="flex-1">
              <h3 className="text-white mb-3">Rev's Overall Assessment</h3>
              <p className="text-white/90 mb-4">
                Outstanding week, Aggie! You're maintaining an 87% productivity score and staying on track with your goals. 
                Your study habits are strong, but I've noticed you're most productive in the morning - let's optimize your 
                schedule to capitalize on that. Keep up the momentum, and you'll ace that MATH 308 exam!
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-green-500/20 text-green-400">On Track for 4.0</Badge>
                <Badge className="bg-[#CFAF5A]/20 text-[#CFAF5A]">Strong Habits</Badge>
                <Badge className="bg-blue-500/20 text-blue-400">Ahead of Schedule</Badge>
              </div>
            </div>
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
}
