import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dashboard } from './components/Dashboard';
import { AskRev } from './components/AskRev';
import { SyllabusUpload } from './components/SyllabusUpload';
import { BudgetAnalytics } from './components/BudgetAnalytics';
import { WeeklyAdvisor } from './components/WeeklyAdvisor';
import { Settings } from './components/Settings';
import { AuthModal } from './components/AuthModal';
import { SyllabusManager } from './components/SyllabusManager';
import { Home, MessageSquare, Upload, DollarSign, TrendingUp, Menu, X, Settings as SettingsIcon, LogOut, BookOpen, Zap, Brain, Calendar } from 'lucide-react';
import { RevLogo } from './components/RevLogo';
import { Button } from './components/ui/button';

type View = 'dashboard' | 'ask-rev' | 'syllabus' | 'budget' | 'advisor' | 'settings' | 'courses';

interface User {
  id: number;
  username: string;
  email: string;
}

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedSyllabus, setSelectedSyllabus] = useState<any>(null);

  const API_BASE_URL = 'http://localhost:5000';

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setAuthToken(token);
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Failed to restore session:', e);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleAuthSuccess = (token: string, userData: User) => {
    setAuthToken(token);
    setUser(userData);
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setShowAuthModal(false);
    setCurrentView('dashboard'); // Auto-navigate to dashboard after login
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setCurrentView('dashboard');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  // Only show these views if authenticated
  const protectedViews: View[] = ['ask-rev', 'syllabus', 'budget', 'advisor', 'courses'];
  const isViewProtected = protectedViews.includes(currentView);

  // Redirect to auth modal if trying to access protected view without auth
  useEffect(() => {
    if (isViewProtected && !authToken) {
      setShowAuthModal(true);
      setCurrentView('dashboard');
    }
  }, [currentView, authToken, isViewProtected]);

  const menuItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: Home },
    ...(authToken ? [
      { id: 'courses' as View, label: 'My Courses', icon: BookOpen },
    { id: 'ask-rev' as View, label: 'Ask Rev', icon: MessageSquare },
      { id: 'syllabus' as View, label: 'Upload Syllabus', icon: Upload },
    { id: 'budget' as View, label: 'Budget', icon: DollarSign },
    { id: 'advisor' as View, label: 'Weekly Advisor', icon: TrendingUp },
    { id: 'settings' as View, label: 'Settings', icon: SettingsIcon },
    ] : []),
  ];

  const renderView = () => {
    if (isViewProtected && !authToken) {
      return null; // Landing page will be shown instead
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'ask-rev':
        return authToken ? <AskRev authToken={authToken} /> : null;
      case 'syllabus':
        return authToken ? <SyllabusUpload authToken={authToken} /> : null;
      case 'budget':
        return authToken ? <BudgetAnalytics /> : null;
      case 'advisor':
        return authToken ? <WeeklyAdvisor /> : null;
      case 'settings':
        return authToken ? <Settings /> : null;
      case 'courses':
        return authToken ? (
          <SyllabusManager
            authToken={authToken}
            onSelectSyllabus={setSelectedSyllabus}
            apiBaseUrl={API_BASE_URL}
          />
        ) : null;
      default:
        return <Dashboard />;
    }
  };

  // Landing Page for Unauthenticated Users
  if (!authToken) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Animated Background Gradients with Parallax */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5],
              x: [0, 50, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-1/4 w-96 h-96 bg-[#500000]/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.1, 1, 1.1],
              opacity: [0.5, 0.8, 0.5],
              x: [0, -50, 0],
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#8B0000]/20 rounded-full blur-3xl"
          />
          {/* Additional accent gradient */}
          <motion.div
            animate={{
              y: [0, 30, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute top-1/3 right-0 w-80 h-80 bg-[#8B0000]/10 rounded-full blur-3xl"
          />
        </div>

        {/* Navigation Bar */}
        <nav className="fixed top-0 w-full z-50 border-b border-white/5 backdrop-blur-xl bg-black/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#500000] to-[#8B0000] flex items-center justify-center p-2">
                <RevLogo />
              </div>
              <span className="text-white font-bold text-lg">RevOS</span>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAuthModal(true)}
              className="bg-[#500000] hover:bg-[#8B0000] text-white font-semibold px-6 py-2 rounded-lg transition-all hover:shadow-lg hover:shadow-[#500000]/50"
            >
              Sign In
            </motion.button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
            >
              Never Miss a Deadline <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#CFAF5A] to-[#8B0000]">Again</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              Upload your syllabus, ask intelligent questions, and get instant answers. RevOS analyzes your courses and helps you stay organized.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAuthModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-[#500000] to-[#8B0000] hover:from-[#8B0000] hover:to-[#500000] text-white font-bold rounded-lg text-lg transition-all shadow-lg hover:shadow-xl hover:shadow-[#500000]/50"
              >
                Get Started Free →
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAuthModal(true)}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-lg text-lg transition-all"
              >
                Learn More
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.8 }}
              className="mt-12 text-gray-500 text-sm"
            >
              <p>✓ No credit card required  •  ✓ Free forever  •  ✓ Join 1000+ students</p>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.1, duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-gray-400 text-lg">Powerful features designed for student success</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Zap,
                  title: 'Smart Syllabus Analysis',
                  description: 'Upload any syllabus and let AI instantly extract key dates, deadlines, grading breakdowns, and course topics. No manual work needed.',
                  color: 'from-[#500000] to-[#8B0000]'
                },
                {
                  icon: Brain,
                  title: 'Ask Rev Anything',
                  description: 'Get instant answers about your courses. "When is my exam?" "What counts toward my grade?" Rev knows it all in seconds.',
                  color: 'from-[#8B0000] to-[#500000]'
                },
                {
                  icon: Calendar,
                  title: 'Stay Perfectly Organized',
                  description: 'Manage all your courses in one place. Track deadlines, exams, and assignments. Never miss an important date again.',
                  color: 'from-[#CFAF5A] to-[#8B0000]'
                }
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ 
                    opacity: 0, 
                    x: idx % 2 === 0 ? -50 : 50,
                    y: 30 
                  }}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: idx * 0.2, duration: 0.8 }}
                  whileHover={{ translateY: -8, scale: 1.03, transition: { duration: 0.3 } }}
                  className="bg-white/5 backdrop-blur border border-white/10 hover:border-[#500000]/50 rounded-2xl p-8 transition-all duration-300 group"
                >
                  <motion.div
                    whileInView={{
                      rotate: idx % 2 === 0 ? 3 : -3,
                    }}
                    transition={{ duration: 0.6 }}
                    className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#500000] to-[#8B0000] flex items-center justify-center text-white text-2xl mb-4 group-hover:scale-110 transition-transform"
                  >
                    <feature.icon className="w-8 h-8" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Floating Demo Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.1, duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                It's So Easy, You'll Wonder Why You Didn't Try It Sooner
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.2, duration: 0.8, type: "spring", damping: 8 }}
              whileHover={{ scale: 1.02 }}
              className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-12 shadow-2xl overflow-hidden"
            >
              <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="contents"
              >
                <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  <h3 className="text-3xl font-bold text-white mb-4">Upload Any Syllabus</h3>
                  <p className="text-gray-300 text-lg mb-6">Just drop your PDF, DOCX, or paste text. Our AI instantly analyzes it and extracts all the important dates, grading info, and topics.</p>
                  <ul className="space-y-3">
                    {['📄 PDF, DOCX & TXT Support', '⚡ Instant Analysis', '🎯 Smart Date Detection'].map((item, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + idx * 0.1, duration: 0.6 }}
                        className="text-gray-300 flex items-center gap-3"
                      >
                        <span className="text-red-400 font-bold">→</span>
                        {item}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>

                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 text-center"
                >
                  <motion.div
                    animate={{
                      rotate: [0, 2, -2, 0],
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="text-6xl mb-4"
                  >
                    📚
                  </motion.div>
                  <p className="text-gray-300 mb-4">Your syllabus is parsed instantly</p>
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    className="inline-block px-4 py-2 bg-red-600/20 border border-red-600/50 rounded-lg text-red-300"
                  >
                    ✓ Ready to use
                  </motion.div>
                </motion.div>
              </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.1, duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Three Simple Steps
              </h2>
              <p className="text-gray-400 text-lg">Get started in under 2 minutes</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connection lines for desktop */}
              <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#500000]/50 to-transparent" />
              
              {/* Animated wave line */}
              <motion.svg
                className="hidden md:block absolute top-16 left-0 right-0 w-full h-1 pointer-events-none"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 1.5 }}
              >
                <motion.path
                  d="M0,2 Q 25%,0 50%,2 T 100%,2"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  animate={{ 
                    strokeDasharray: [0, 500],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="50%" stopColor="rgb(80, 0, 0)" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </motion.svg>

              {[
                { number: '1', title: 'Sign Up', description: 'Create a free account in seconds with your email' },
                { number: '2', title: 'Upload Syllabus', description: 'Upload your PDF or paste syllabus text' },
                { number: '3', title: 'Ask Away', description: 'Start asking questions and get instant answers' }
              ].map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: idx * 0.2, duration: 0.8 }}
                  className="text-center relative z-10"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, transition: { duration: 0.3 } }}
                    whileInView={{ scale: 1 }}
                    animate={{
                      y: idx % 2 === 0 ? [0, -20, 0] : [0, 20, 0],
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-[#500000] to-[#8B0000] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 cursor-pointer shadow-lg hover:shadow-[#500000]/50 transition-all duration-300"
                  >
                    {idx + 1}
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="relative py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-red-600/20 to-red-500/10 border border-red-600/20 rounded-2xl p-12 backdrop-blur"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                {[
                  { number: '99.9%', label: 'Uptime' },
                  { number: '<200ms', label: 'Latency' },
                  { number: '>95%', label: 'Accuracy' }
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8, y: 20, filter: "blur(10px)" }}
                    whileInView={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: idx * 0.2, duration: 0.8 }}
                    whileHover={{ scale: 1.08, y: -10 }}
                    className="text-center bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 hover:border-[#500000]/50 transition-all duration-300"
                  >
                    <motion.div
                      animate={{
                        y: [0, -15, 0],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#CFAF5A] to-[#500000] mb-2"
                    >
                      {stat.number}
                    </motion.div>
                    <p className="text-gray-400 text-lg">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.1, duration: 0.8 }}
              className="mb-8"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Ready to Transform Your Academic Life?</h2>
              <p className="text-gray-400 text-lg">Join hundreds of students who are already using RevOS to stay organized and ace their classes.</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(80,0,0,0.6)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAuthModal(true)}
                className="px-10 py-4 bg-gradient-to-r from-[#500000] to-[#8B0000] hover:from-[#8B0000] hover:to-[#500000] text-white font-bold rounded-lg text-lg transition-all shadow-lg"
              >
                Start For Free Today →
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, borderColor: "rgb(220, 38, 38)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAuthModal(true)}
                className="px-10 py-4 bg-transparent border-2 border-white/20 text-white font-bold rounded-lg text-lg hover:border-red-600 transition-all"
              >
                Schedule Demo
              </motion.button>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative border-t border-white/5 backdrop-blur py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center text-gray-500 text-sm">
            <p>© 2025 RevOS. Built for Texas A&M students.</p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <a href="#" className="hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-white transition">Terms</a>
              <a href="#" className="hover:text-white transition">Contact</a>
            </div>
          </div>
        </footer>

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
          apiBaseUrl={API_BASE_URL}
        />
      </div>
    );
  }

  // Authenticated App Layout
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
        apiBaseUrl={API_BASE_URL}
      />

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-secondary/10 via-transparent to-transparent rounded-full blur-3xl"
        />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex h-screen overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border h-full">
          <div className="p-6 border-b border-border">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                <RevLogo size="md" className="text-white" />
              </div>
              <div>
                <h1 className="font-bold text-foreground">RevOS</h1>
                <p className="text-xs text-muted-foreground">Study Assistant</p>
              </div>
            </motion.div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  currentView === item.id
                    ? 'bg-red-600 text-white'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-border space-y-3">
            <div className="px-4 py-2">
              <p className="text-sm font-medium text-foreground">{user?.username}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full flex items-center gap-2"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
              <motion.div
              initial={{ x: -400 }}
                animate={{ x: 0 }}
              exit={{ x: -400 }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed md:hidden w-64 bg-card border-r border-border h-full z-40 flex flex-col"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                    <RevLogo size="md" className="text-white" />
                  </div>
                  <h1 className="font-bold">RevOS</h1>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-2">
                    <X className="w-5 h-5" />
                </button>
                </div>

              <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                {menuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentView(item.id);
                          setSidebarOpen(false);
                        }}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                      currentView === item.id
                        ? 'bg-red-600 text-white'
                        : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </button>
                ))}
                </nav>

              <div className="p-4 border-t border-border space-y-3">
                <div className="px-4 py-2">
                  <p className="text-sm font-medium">{user?.username}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="bg-card border-b border-border px-4 py-4 flex items-center justify-between md:justify-start gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-accent rounded-lg"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="flex-1 md:hidden">
              <h1 className="font-bold text-lg">RevOS</h1>
            </div>

            {/* User Menu (Desktop) */}
            <div className="hidden md:flex items-center gap-4 ml-auto">
              <span className="text-sm text-muted-foreground">
                Welcome, <strong>{user?.username}</strong>
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
            </Button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="p-6"
              >
                {renderView()}
              </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
