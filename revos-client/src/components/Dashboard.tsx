import { GlassPanel } from './GlassPanel';
import { Calendar } from './ui/calendar';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { CheckCircle2, Circle, TrendingUp, DollarSign, BookOpen, Calendar as CalendarIcon, Loader } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

interface DashboardProps {
  authToken?: string;
  apiBaseUrl?: string;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  due: string;
  priority: 'high' | 'medium' | 'low';
  course: string;
  dueDate?: Date;
}

interface CalendarEvent {
  time: string;
  title: string;
  location: string;
}

export function Dashboard({ authToken, apiBaseUrl = 'http://localhost:5000' }: DashboardProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [thisWeeksTasks, setThisWeeksTasks] = useState<Task[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authToken) {
      loadDashboardData();
    }
  }, [authToken]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Debug: Log the token
      console.log('📊 Dashboard - authToken:', authToken ? `${authToken.substring(0, 20)}...` : 'EMPTY');
      console.log('📊 Dashboard - apiBaseUrl:', apiBaseUrl);

      if (!authToken) {
        console.warn('⚠️ No auth token available');
        setIsLoading(false);
        return;
      }

      // Fetch weekly advisor data which includes both syllabus and calendar
      const response = await fetch(`${apiBaseUrl}/api/weekly-advisor`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 Dashboard - Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Dashboard - Error response:', errorText);
        throw new Error('Failed to load dashboard data');
      }

      const data = await response.json();

      // Process assignments into tasks
      const processedTasks: Task[] = [];
      if (data.assignments && Array.isArray(data.assignments)) {
        data.assignments.forEach((assignment: any, index: number) => {
          // Parse due date
          const dueDate = new Date(assignment.date);
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const todayEnd = new Date(today);
          todayEnd.setDate(todayEnd.getDate() + 1);
          
          const diffTime = dueDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // Determine due text and priority
          let dueText = '';
          let priority: 'high' | 'medium' | 'low' = 'medium';

          if (diffDays < 0) {
            dueText = 'Overdue';
            priority = 'high';
          } else if (diffDays === 0) {
            dueText = 'Today';
            priority = 'high';
          } else if (diffDays === 1) {
            dueText = 'Tomorrow';
            priority = 'high';
          } else if (diffDays <= 3) {
            dueText = `In ${diffDays} days`;
            priority = 'high';
          } else if (diffDays <= 7) {
            dueText = `In ${diffDays} days`;
            priority = 'medium';
          } else {
            dueText = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            priority = 'low';
          }

          processedTasks.push({
            id: `task-${index}`,
            title: assignment.title || assignment.event || 'Assignment',
            completed: assignment.type === 'completed',
            due: dueText,
            priority,
            course: assignment.course || 'Unknown Course',
            dueDate,
          });
        });
      }

      // Sort tasks by due date
      processedTasks.sort((a, b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0));

      // Separate today's tasks and this week's tasks
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const todaysTasksList = processedTasks.filter(task => {
        const taskDate = new Date(task.dueDate || 0);
        const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
        return taskDateOnly.getTime() === today.getTime();
      });

      const thisWeeksTasksList = processedTasks.filter(task => {
        const taskDate = new Date(task.dueDate || 0);
        const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
        return taskDateOnly > today && taskDateOnly <= weekEnd;
      });

      // Store separately in state
      setTasks(processedTasks.slice(0, 6));
      setTodaysTasks(todaysTasksList);
      setThisWeeksTasks(thisWeeksTasksList);

      // Process calendar events
      const processedEvents: CalendarEvent[] = [];
      if (data.calendarEvents && Array.isArray(data.calendarEvents)) {
        data.calendarEvents.forEach((event: any) => {
          const eventDate = new Date(event.start);
          const time = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

          processedEvents.push({
            time,
            title: event.title || 'Event',
            location: event.location || 'No location',
          });
        });
      }

      // Limit to 3 upcoming events
      setUpcomingEvents(processedEvents.slice(0, 3));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Keep empty states if error occurs
    } finally {
      setIsLoading(false);
    }
  };

  const insights = [
    { icon: BookOpen, label: 'Courses', value: 'Active', change: '+2', color: 'text-secondary' },
    { icon: TrendingUp, label: 'Productivity', value: 'On Track', change: '+5%', color: 'text-secondary' },
    { icon: DollarSign, label: 'Status', value: 'Great', change: '✓', color: 'text-green-400' },
  ];

  const formattedDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-secondary mb-2">Welcome back, Aggie!</h1>
          <p className="text-muted-foreground">{formattedDate}</p>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="px-6 py-3 rounded-xl gradient-maroon glow-maroon"
        >
          <p className="text-primary-foreground">🎓 Keep grinding!</p>
        </motion.div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks */}
          <GlassPanel glow="maroon">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-foreground">📅 Today's Tasks</h2>
              <Badge className="bg-secondary text-secondary-foreground">
                {todaysTasks.length > 0 ? `${todaysTasks.length} today` : 'None'}
              </Badge>
            </div>
            <div className="space-y-3 min-h-[120px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-[120px]">
                  <Loader className="w-6 h-6 text-secondary animate-spin" />
                </div>
              ) : todaysTasks.length > 0 ? (
                todaysTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="flex items-start gap-4 p-3 rounded-xl glass-card border-l-4 border-secondary cursor-pointer"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={`text-foreground text-sm ${task.completed ? 'line-through opacity-60' : ''}`}>
                        {task.title}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {task.course}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        task.priority === 'high'
                          ? 'border-red-400 text-red-400'
                          : task.priority === 'medium'
                          ? 'border-secondary text-secondary'
                          : 'border-muted-foreground text-muted-foreground'
                      }`}
                    >
                      {task.priority}
                    </Badge>
                  </motion.div>
                ))
              ) : (
                <div className="flex items-center justify-center h-[120px] text-muted-foreground">
                  <p>✨ No tasks due today - enjoy your day!</p>
                </div>
              )}
            </div>
          </GlassPanel>

          {/* This Week's Tasks */}
          <GlassPanel>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-foreground">📆 This Week's Tasks</h2>
              <Badge className="bg-secondary/50 text-secondary-foreground">
                {thisWeeksTasks.length > 0 ? `${thisWeeksTasks.length} this week` : 'None'}
              </Badge>
            </div>
            <div className="space-y-3 min-h-[180px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-[180px]">
                  <Loader className="w-6 h-6 text-secondary animate-spin" />
                </div>
              ) : thisWeeksTasks.length > 0 ? (
                thisWeeksTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="flex items-start gap-4 p-3 rounded-xl glass-card border-l-4 border-secondary/50 cursor-pointer"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={`text-foreground text-sm ${task.completed ? 'line-through opacity-60' : ''}`}>
                        {task.title}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {task.course} • {task.due}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        task.priority === 'high'
                          ? 'border-red-400 text-red-400'
                          : task.priority === 'medium'
                          ? 'border-secondary text-secondary'
                          : 'border-muted-foreground text-muted-foreground'
                      }`}
                    >
                      {task.priority}
                    </Badge>
                  </motion.div>
                ))
              ) : (
                <div className="flex items-center justify-center h-[180px] text-muted-foreground">
                  <p>✨ No tasks scheduled for this week</p>
                </div>
              )}
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
                  <p className="text-muted-foreground mb-1">{insight.label}</p>
                  <h3 className="text-foreground mb-1">{insight.value}</h3>
                  <p className={`${insight.change.startsWith('+') || insight.change === '✓' ? 'text-green-400' : 'text-red-400'}`}>
                    {insight.change}
                  </p>
                </GlassPanel>
              </motion.div>
            ))}
          </div>

          {/* Weekly Progress */}
          <GlassPanel>
            <h3 className="text-foreground mb-4">Study Overview</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Upcoming Deadlines</span>
                  <span className="text-secondary">{tasks.length}</span>
                </div>
                <Progress value={Math.min(tasks.length * 15, 100)} className="h-2 bg-white/10" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">This Week</span>
                  <span className="text-secondary">Active</span>
                </div>
                <Progress value={50} className="h-2 bg-white/10" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">On Track</span>
                  <span className="text-secondary">✓</span>
                </div>
                <Progress value={100} className="h-2 bg-white/10" />
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Calendar */}
          <GlassPanel glow="gold">
            <h3 className="text-foreground mb-4">Calendar</h3>
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
              <CalendarIcon className="w-5 h-5 text-secondary" />
              <h3 className="text-foreground">Today's Schedule</h3>
            </div>
            <div className="space-y-3 min-h-[150px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-[150px]">
                  <Loader className="w-4 h-4 text-secondary animate-spin" />
                </div>
              ) : upcomingEvents.length > 0 ? (
                upcomingEvents.map((event, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="p-3 rounded-lg glass-card"
                  >
                    <p className="text-secondary text-sm">{event.time}</p>
                    <p className="text-foreground mt-1">{event.title}</p>
                    <p className="text-muted-foreground text-sm">{event.location}</p>
                  </motion.div>
                ))
              ) : (
                <div className="flex items-center justify-center h-[150px] text-muted-foreground">
                  <p>No events scheduled for today</p>
                </div>
              )}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
