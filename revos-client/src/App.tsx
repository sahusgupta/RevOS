import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dashboard } from './components/Dashboard';
import { AskRev } from './components/AskRev';
import { SyllabusUpload } from './components/SyllabusUpload';
import { BudgetAnalytics } from './components/BudgetAnalytics';
import { WeeklyAdvisor } from './components/WeeklyAdvisor';
import { Settings } from './components/Settings';
import { Home, MessageSquare, Upload, DollarSign, TrendingUp, Menu, X, Sparkles, Settings as SettingsIcon } from 'lucide-react';
import { Button } from './components/ui/button';

type View = 'dashboard' | 'ask-rev' | 'syllabus' | 'budget' | 'advisor' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: Home },
    { id: 'ask-rev' as View, label: 'Ask Rev', icon: MessageSquare },
    { id: 'syllabus' as View, label: 'Syllabus Parser', icon: Upload },
    { id: 'budget' as View, label: 'Budget', icon: DollarSign },
    { id: 'advisor' as View, label: 'Weekly Advisor', icon: TrendingUp },
    { id: 'settings' as View, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
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
      <div className="relative z-10 flex h-screen">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-72 border-r border-white/10 glass-panel backdrop-blur-2xl">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 rounded-2xl gradient-maroon glow-maroon flex items-center justify-center"
              >
                <Sparkles className="w-6 h-6 text-[#CFAF5A]" />
              </motion.div>
              <div>
                <h1 className="text-white">RevOS</h1>
                <p className="text-[#CFAF5A]">by Texas A&M</p>
              </div>
            </motion.div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'gradient-maroon glow-maroon text-white'
                      : 'glass-card text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-2 h-2 rounded-full bg-[#CFAF5A]"
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-white/10">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 p-3 rounded-xl glass-card cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
                <span className="text-[#500000]">AG</span>
              </div>
              <div className="flex-1">
                <p className="text-white">Aggie Student</p>
                <p className="text-white/60">Class of '27</p>
              </div>
            </motion.div>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              />
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", damping: 20 }}
                className="fixed top-0 left-0 bottom-0 w-72 glass-panel backdrop-blur-2xl z-50 lg:hidden flex flex-col"
              >
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl gradient-maroon glow-maroon flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-[#CFAF5A]" />
                    </div>
                    <div>
                      <h1 className="text-white">RevOS</h1>
                      <p className="text-[#CFAF5A]">by Texas A&M</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(false)}
                    className="text-white"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentView(item.id);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          isActive
                            ? 'gradient-maroon glow-maroon text-white'
                            : 'glass-card text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>

                <div className="p-4 border-t border-white/10">
                  <div className="flex items-center gap-3 p-3 rounded-xl glass-card">
                    <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
                      <span className="text-[#500000]">AG</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white">Aggie Student</p>
                      <p className="text-white/60">Class of '27</p>
                    </div>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <header className="lg:hidden flex items-center justify-between p-4 border-b border-white/10 glass-panel backdrop-blur-2xl">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-white"
            >
              <Menu className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-maroon glow-maroon flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#CFAF5A]" />
              </div>
              <h2 className="text-white">RevOS</h2>
            </div>
            <div className="w-10" />
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="max-w-7xl mx-auto w-full"
              >
                {currentView === 'dashboard' && <Dashboard />}
                {currentView === 'ask-rev' && <AskRev />}
                {currentView === 'syllabus' && <SyllabusUpload />}
                {currentView === 'budget' && <BudgetAnalytics />}
                {currentView === 'advisor' && <WeeklyAdvisor />}
                {currentView === 'settings' && <Settings />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
