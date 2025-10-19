import { useState, useEffect } from 'react';
import { GlassPanel } from './GlassPanel';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Palette,
  Bell,
  Shield,
  User,
  Globe,
  Monitor
} from 'lucide-react';
import { motion } from 'framer-motion';

type Theme = 'light' | 'dark' | 'system';

export function Settings() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme;
    return saved || 'system';
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : {
      assignments: true,
      budget: true,
      study: false,
      weekly: true
    };
  });

  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('preferences');
    return saved ? JSON.parse(saved) : {
      autoSave: true,
      analytics: true,
      tips: true
    };
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  // Save preferences
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('preferences', JSON.stringify(preferences));
  }, [preferences]);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev: any) => ({ ...prev, [key]: value }));
  };

  const handlePreferenceChange = (key: string, value: boolean) => {
    setPreferences((prev: any) => ({ ...prev, [key]: value }));
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-primary/20 border border-secondary/30">
              <SettingsIcon className="w-8 h-8 text-secondary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Settings</h1>
          </div>
          <p className="text-muted-foreground text-lg">Customize your RevOS experience</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Theme Settings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassPanel className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Palette className="w-5 h-5 text-secondary" />
                <h2 className="text-xl font-semibold text-foreground">Appearance</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-foreground/80 text-sm font-medium mb-3 block">
                    Theme Mode
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {themeOptions.map(({ value, label, icon: Icon }) => (
                      <Button
                        key={value}
                        variant={theme === value ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleThemeChange(value as Theme)}
                        className={`flex flex-col items-center gap-2 h-auto py-3 ${
                          theme === value
                            ? 'bg-primary hover:bg-primary/90 text-primary-foreground border-secondary'
                            : 'border-border text-muted-foreground hover:border-secondary/50 hover:text-foreground'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs">{label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator className="bg-border" />
              </div>
            </GlassPanel>
          </motion.div>

          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassPanel className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-5 h-5 text-secondary" />
                <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'assignments', label: 'Assignment Reminders', description: 'Get notified about upcoming deadlines' },
                  { key: 'budget', label: 'Budget Alerts', description: 'Spending limit and budget notifications' },
                  { key: 'study', label: 'Study Session Reminders', description: 'Scheduled study time notifications' },
                  { key: 'weekly', label: 'Weekly Reports', description: 'Weekly productivity and insights summary' }
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label className="text-foreground/80 font-medium">{label}</Label>
                      <p className="text-muted-foreground text-sm">{description}</p>
                    </div>
                    <Switch
                      checked={notifications[key]}
                      onCheckedChange={(checked) => handleNotificationChange(key, checked)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                ))}
              </div>
            </GlassPanel>
          </motion.div>

          {/* Privacy & Security */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassPanel className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-5 h-5 text-secondary" />
                <h2 className="text-xl font-semibold text-foreground">Privacy & Security</h2>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'autoSave', label: 'Auto-save Data', description: 'Automatically save your progress' },
                  { key: 'analytics', label: 'Usage Analytics', description: 'Help improve RevOS with usage data' },
                  { key: 'tips', label: 'Personalized Tips', description: 'Receive AI-powered study suggestions' }
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label className="text-foreground/80 font-medium">{label}</Label>
                      <p className="text-muted-foreground text-sm">{description}</p>
                    </div>
                    <Switch
                      checked={preferences[key]}
                      onCheckedChange={(checked) => handlePreferenceChange(key, checked)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                ))}
              </div>
            </GlassPanel>
          </motion.div>

          {/* Account Settings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassPanel className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-5 h-5 text-secondary" />
                <h2 className="text-xl font-semibold text-foreground">Account</h2>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/30 border-2 border-secondary/50 flex items-center justify-center">
                      <User className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-foreground font-medium">Aggie Student</h3>
                      <p className="text-muted-foreground text-sm">student@tamu.edu</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-border text-muted-foreground hover:border-secondary/50 hover:text-foreground"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Language & Region
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-border text-muted-foreground hover:border-secondary/50 hover:text-foreground"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Privacy Policy
                  </Button>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
