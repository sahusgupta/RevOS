import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Loader2, CheckCircle, AlertCircle, Unlink } from 'lucide-react';
import { Button } from './ui/button';
import { GlassPanel } from './GlassPanel';

interface Calendar {
  id: string;
  summary: string;
  primary: boolean;
  timeZone: string;
}

interface GoogleCalendarAuthProps {
  authToken: string;
  isConnected: boolean;
  onConnected?: () => void;
  apiBaseUrl?: string;
}

export function GoogleCalendarAuth({
  authToken,
  isConnected,
  onConnected,
  apiBaseUrl = 'http://localhost:5000',
}: GoogleCalendarAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('primary');
  const [showCalendarSelector, setShowCalendarSelector] = useState(false);

  // Load calendars when connected
  React.useEffect(() => {
    if (isConnected) {
      loadCalendars();
    }
  }, [isConnected]);

  const loadCalendars = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/google-calendar/list-calendars`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load calendars');
      }

      const data = await response.json();
      setCalendars(data.calendars);
      setSelectedCalendarId(data.selected_calendar_id);
    } catch (err) {
      console.error('Failed to load calendars:', err);
    }
  };

  const handleCalendarSelect = async (calendarId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${apiBaseUrl}/api/google-calendar/select-calendar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ calendar_id: calendarId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to select calendar');
      }

      setSelectedCalendarId(calendarId);
      setShowCalendarSelector(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get auth URL from backend
      const response = await fetch(`${apiBaseUrl}/api/google-calendar/auth-url`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get authorization URL');
      }

      const data = await response.json();
      const authUrl = data.auth_url;

      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Google Calendar');
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${apiBaseUrl}/api/google-calendar/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect Google Calendar');
      }

      // Refresh to update UI
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
      setIsLoading(false);
    }
  };

  const selectedCalendar = calendars.find(cal => cal.id === selectedCalendarId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <GlassPanel className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-secondary" />
            <div>
              <h3 className="text-foreground font-semibold">Google Calendar</h3>
              <p className="text-foreground/60 text-sm">
                {isConnected ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          {isConnected && <CheckCircle className="w-5 h-5 text-green-500" />}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <p className="text-foreground/70 text-sm mb-4">
          {isConnected
            ? 'Your Google Calendar is connected. Rev can now suggest events and study sessions directly in your calendar.'
            : 'Connect your Google Calendar to allow Rev to sync assignments and create study sessions automatically.'}
        </p>

        {isConnected && calendars.length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-card border border-border">
            <label className="text-foreground/70 text-sm font-medium block mb-2">
              📅 Calendar to Use
            </label>
            <div className="relative">
              <button
                onClick={() => setShowCalendarSelector(!showCalendarSelector)}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-left hover:border-secondary/50 disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span>
                    {selectedCalendar?.summary || 'Select Calendar'}
                    {selectedCalendar?.primary && ' (Primary)'}
                  </span>
                  <span className="text-xs text-foreground/60">{calendars.length} calendars</span>
                </div>
              </button>

              {showCalendarSelector && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10">
                  <div className="max-h-64 overflow-y-auto">
                    {calendars.map((cal) => (
                      <button
                        key={cal.id}
                        onClick={() => handleCalendarSelect(cal.id)}
                        disabled={isLoading}
                        className={`w-full text-left px-4 py-2 hover:bg-card disabled:opacity-50 border-b border-border last:border-b-0 ${
                          selectedCalendarId === cal.id ? 'bg-card text-secondary font-medium' : 'text-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{cal.summary}</span>
                          {cal.primary && <span className="text-xs text-foreground/60">(Primary)</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {isConnected ? (
            <Button
              onClick={handleDisconnect}
              disabled={isLoading}
              variant="outline"
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <Unlink className="w-4 h-4" />
                  Disconnect Calendar
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={isLoading}
              className="bg-[#500000] hover:bg-[#8B0000] gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  Connect Google Calendar
                </>
              )}
            </Button>
          )}
        </div>
      </GlassPanel>
    </motion.div>
  );
}
