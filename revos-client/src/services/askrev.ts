/**
 * Ask Rev Service
 * Handles worksheet generation, calendar management, study planning, and campus recommendations
 */

export interface Worksheet {
  id: string;
  title: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: WorksheetQuestion[];
  instructions: string;
  createdAt: Date;
}

export interface WorksheetQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'short-answer' | 'essay' | 'problem';
  options?: string[];
  answer?: string;
  points: number;
}

export interface StudyPlan {
  id: string;
  courseId: string;
  courseName: string;
  goal: string;
  startDate: Date;
  endDate: Date;
  topics: StudyTopic[];
  dailyGoals: DailyGoal[];
  notes: string;
}

export interface StudyTopic {
  name: string;
  priority: 'high' | 'medium' | 'low';
  estimatedHours: number;
  resources: string[];
  completed: boolean;
}

export interface DailyGoal {
  date: Date;
  topics: string[];
  estimatedMinutes: number;
  completed: boolean;
  notes: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  type: 'exam' | 'study-session' | 'class' | 'other';
  googleCalendarId?: string;
}

export interface CampusRecommendation {
  id: string;
  name: string;
  category: 'dining' | 'study' | 'recreation' | 'explore';
  description: string;
  location: string;
  distance: string;
  rating: number;
  hours?: string;
  website?: string;
  whyRecommended: string;
}

export class AskRevService {
  private static readonly API_BASE = 'http://localhost:5000';

  /**
   * Generate a worksheet for a topic
   */
  static async generateWorksheet(
    topic: string,
    difficulty: 'easy' | 'medium' | 'hard',
    numQuestions: number,
    authToken: string,
    courseId?: string
  ): Promise<Worksheet> {
    try {
      const response = await fetch(
        `${this.API_BASE}/api/ask-rev/generate-worksheet`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic,
            difficulty,
            numQuestions,
            courseId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to generate worksheet: ${response.statusText}`);
      }

      const data = await response.json();
      const worksheet = data.worksheet || data;
      console.log('✅ Worksheet generated:', worksheet);
      return worksheet;
    } catch (error) {
      console.error('❌ Error generating worksheet:', error);
      throw error;
    }
  }

  /**
   * Generate a personalized study plan
   */
  static async generateStudyPlan(
    courseId: string,
    courseName: string,
    examDate: Date,
    currentTopics: string[],
    authToken: string
  ): Promise<StudyPlan> {
    try {
      const response = await fetch(
        `${this.API_BASE}/api/ask-rev/generate-study-plan`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseId,
            courseName,
            examDate: examDate.toISOString(),
            currentTopics,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to generate study plan: ${response.statusText}`);
      }

      const data = await response.json();
      const studyPlan = data.studyPlan || data;
      console.log('✅ Study plan generated:', studyPlan);
      return studyPlan;
    } catch (error) {
      console.error('❌ Error generating study plan:', error);
      throw error;
    }
  }

  /**
   * Add event to Google Calendar
   */
  static async addCalendarEvent(
    event: CalendarEvent,
    authToken: string
  ): Promise<CalendarEvent> {
    try {
      const response = await fetch(
        `${this.API_BASE}/api/ask-rev/calendar/add-event`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: event.title,
            description: event.description,
            startTime: event.startTime.toISOString(),
            endTime: event.endTime.toISOString(),
            type: event.type,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to add calendar event: ${response.statusText}`);
      }

      const data = await response.json();
      const createdEvent = data.event || data;
      console.log('✅ Calendar event created:', createdEvent);
      return createdEvent;
    } catch (error) {
      console.error('❌ Error adding calendar event:', error);
      throw error;
    }
  }

  /**
   * Block out time on Google Calendar (busy time)
   */
  static async blockCalendarTime(
    title: string,
    startTime: Date,
    endTime: Date,
    reason: string,
    authToken: string
  ): Promise<CalendarEvent> {
    try {
      const response = await fetch(
        `${this.API_BASE}/api/ask-rev/calendar/block-time`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            reason,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to block calendar time: ${response.statusText}`);
      }

      const data = await response.json();
      const blockedEvent = data.event || data;
      console.log('✅ Calendar time blocked:', blockedEvent);
      return blockedEvent;
    } catch (error) {
      console.error('❌ Error blocking calendar time:', error);
      throw error;
    }
  }

  /**
   * Get campus recommendations
   */
  static async getCampusRecommendations(
    category?: 'dining' | 'study' | 'recreation' | 'explore',
    preferences?: string[],
    authToken?: string
  ): Promise<CampusRecommendation[]> {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (preferences) params.append('preferences', preferences.join(','));

      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(
        `${this.API_BASE}/api/ask-rev/campus-recommendations?${params.toString()}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get campus recommendations: ${response.statusText}`);
      }

      const data = await response.json();
      const recommendations = data.recommendations || data;
      console.log('✅ Campus recommendations loaded:', recommendations);
      return recommendations;
    } catch (error) {
      console.error('❌ Error getting campus recommendations:', error);
      // Return default recommendations if API fails
      return this.getDefaultRecommendations(category);
    }
  }

  /**
   * Get default campus recommendations (when API is unavailable)
   */
  private static getDefaultRecommendations(
    category?: string
  ): CampusRecommendation[] {
    const allRecommendations: CampusRecommendation[] = [
      {
        id: '1',
        name: 'Memorial Student Center (MSC)',
        category: 'explore',
        description: 'Central hub for student activities, dining, and events',
        location: 'Central Campus',
        distance: 'Central',
        rating: 4.5,
        whyRecommended: 'Great place to explore campus and meet people',
      },
      {
        id: '2',
        name: 'The Aggie Food Court',
        category: 'dining',
        description: 'Multiple dining options in one convenient location',
        location: 'MSC Building',
        distance: 'Central',
        rating: 4.2,
        hours: '6am - 10pm daily',
        whyRecommended: 'Variety of cuisines and quick service',
      },
      {
        id: '3',
        name: 'Evans Library',
        category: 'study',
        description: 'Main library with quiet study areas and collaborative spaces',
        location: 'West Campus',
        distance: '0.3 miles',
        rating: 4.7,
        hours: '7am - Midnight',
        whyRecommended: 'Perfect for focused studying with excellent resources',
      },
      {
        id: '4',
        name: 'Cushing Memorial Library and Archives',
        category: 'study',
        description: 'Specialized research library with unique collections',
        location: 'Central Campus',
        distance: '0.2 miles',
        rating: 4.8,
        whyRecommended: 'Excellent for research projects and quiet study',
      },
      {
        id: '5',
        name: 'The Rec',
        category: 'recreation',
        description: 'State-of-the-art recreational facilities',
        location: 'North Campus',
        distance: '0.5 miles',
        rating: 4.6,
        hours: '6am - 10pm Mon-Fri, 8am - 8pm Sat-Sun',
        whyRecommended: 'Great for stress relief and staying active',
      },
      {
        id: '6',
        name: 'Northgate District',
        category: 'explore',
        description: 'Local restaurants, shops, and entertainment',
        location: 'North of Campus',
        distance: '0.1 miles',
        rating: 4.4,
        whyRecommended: 'Popular student hangout with diverse options',
      },
      {
        id: '7',
        name: 'Café Eccell',
        category: 'dining',
        description: 'Cozy café with coffee, pastries, and sandwiches',
        location: 'Evans Library',
        distance: 'In Library',
        rating: 4.3,
        hours: '7am - 6pm daily',
        whyRecommended: 'Perfect for study breaks with great coffee',
      },
      {
        id: '8',
        name: 'Academic Plaza',
        category: 'study',
        description: 'Outdoor study spaces and tutoring centers',
        location: 'Central Campus',
        distance: 'Central',
        rating: 4.5,
        whyRecommended: 'Great for group study and tutoring',
      },
    ];

    if (category) {
      return allRecommendations.filter(r => r.category === category);
    }
    return allRecommendations;
  }

  /**
   * Get study tips for a topic
   */
  static async getStudyTips(
    topic: string,
    courseId?: string,
    authToken?: string
  ): Promise<string[]> {
    try {
      const params = new URLSearchParams();
      params.append('topic', topic);
      if (courseId) params.append('courseId', courseId);

      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(
        `${this.API_BASE}/api/ask-rev/study-tips?${params.toString()}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get study tips: ${response.statusText}`);
      }

      const data = await response.json();
      const tips = data.tips || data;
      console.log('✅ Study tips loaded:', tips);
      return tips;
    } catch (error) {
      console.error('❌ Error getting study tips:', error);
      return [];
    }
  }
}
