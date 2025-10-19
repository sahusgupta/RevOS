"""
Canvas Calendar Integration Service
Handles parsing Canvas calendar feeds (iCalendar format) to extract assignments, events, and deadlines
"""

import logging
import requests
from typing import Dict, List, Optional, Any
from datetime import datetime
import icalendar
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

class CanvasCalendarManager:
    """Manages Canvas calendar feed integration"""
    
    @staticmethod
    def fetch_canvas_calendar(calendar_url: str) -> Optional[icalendar.Calendar]:
        """Fetch and parse Canvas calendar feed"""
        try:
            if not calendar_url:
                logger.error("Canvas calendar URL is empty")
                return None
            
            logger.info(f"Fetching Canvas calendar from: {calendar_url}")
            
            response = requests.get(calendar_url, timeout=10)
            response.raise_for_status()
            
            calendar = icalendar.Calendar.from_ical(response.content)
            logger.info("✅ Successfully parsed Canvas calendar feed")
            return calendar
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Error fetching Canvas calendar: {e}")
            return None
        except Exception as e:
            logger.error(f"❌ Error parsing Canvas calendar: {e}")
            return None
    
    @staticmethod
    def extract_events(calendar: icalendar.Calendar) -> List[Dict[str, Any]]:
        """Extract all events from Canvas calendar feed"""
        try:
            events = []
            
            for component in calendar.walk():
                if component.name == "VEVENT":
                    event_data = CanvasCalendarManager._parse_vevent(component)
                    if event_data:
                        events.append(event_data)
            
            logger.info(f"✅ Extracted {len(events)} events from Canvas calendar")
            return events
            
        except Exception as e:
            logger.error(f"❌ Error extracting events: {e}")
            return []
    
    @staticmethod
    def _parse_vevent(component) -> Optional[Dict[str, Any]]:
        """Parse individual VEVENT component"""
        try:
            event = {}
            
            # Extract basic fields
            event['summary'] = str(component.get('summary', 'Untitled'))
            event['description'] = str(component.get('description', ''))
            
            # Parse dates
            dtstart = component.get('dtstart')
            dtend = component.get('dtend')
            
            if dtstart:
                dt = dtstart.dt
                event['start_date'] = dt.isoformat() if hasattr(dt, 'isoformat') else str(dt)
            
            if dtend:
                dt = dtend.dt
                event['end_date'] = dt.isoformat() if hasattr(dt, 'isoformat') else str(dt)
            
            # Extract location
            event['location'] = str(component.get('location', ''))
            
            # Extract URL
            event['url'] = str(component.get('url', ''))
            
            # Determine event type
            event['type'] = CanvasCalendarManager._determine_event_type(event['summary'])
            
            # Extract course code if present
            event['course'] = CanvasCalendarManager._extract_course_code(event['summary'])
            
            return event
            
        except Exception as e:
            logger.error(f"❌ Error parsing VEVENT: {e}")
            return None
    
    @staticmethod
    def _determine_event_type(summary: str) -> str:
        """Determine event type based on summary text"""
        summary_lower = summary.lower()
        
        if any(x in summary_lower for x in ['[hw]', 'homework', 'assignment']):
            return 'homework'
        elif any(x in summary_lower for x in ['exam', 'midterm', 'final']):
            return 'exam'
        elif any(x in summary_lower for x in ['quiz', 'quizzes']):
            return 'quiz'
        elif any(x in summary_lower for x in ['lab', 'laboratory']):
            return 'lab'
        elif any(x in summary_lower for x in ['project', 'presentation']):
            return 'project'
        else:
            return 'event'
    
    @staticmethod
    def _extract_course_code(summary: str) -> Optional[str]:
        """Extract course code from summary (e.g., CSCE-120, CHEM 107)"""
        import re
        
        # Pattern: COURSE_LETTERS COURSE_DIGITS or COURSE_LETTERS-COURSE_DIGITS
        pattern = r'([A-Z]+\s*-?\s*\d+)'
        match = re.search(pattern, summary)
        
        if match:
            course = match.group(1).replace(' ', '').replace('-', ' ')
            return course
        
        return None
    
    @staticmethod
    def format_for_syllabus(events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Format Canvas events into syllabus-compatible structure"""
        try:
            formatted = {
                'keyDates': [],
                'topics': [],
                'events': []
            }
            
            for event in events:
                if event['type'] == 'homework':
                    formatted['keyDates'].append({
                        'date': event.get('start_date', ''),
                        'event': event['summary'],
                        'type': 'homework',
                        'note': event.get('description', '')
                    })
                elif event['type'] == 'exam':
                    formatted['keyDates'].append({
                        'date': event.get('start_date', ''),
                        'event': event['summary'],
                        'type': 'exam',
                        'note': event.get('location', '')
                    })
                elif event['type'] == 'quiz':
                    formatted['keyDates'].append({
                        'date': event.get('start_date', ''),
                        'event': event['summary'],
                        'type': 'quiz',
                        'note': ''
                    })
                
                formatted['events'].append(event)
            
            logger.info(f"✅ Formatted {len(formatted['keyDates'])} key dates from Canvas events")
            return formatted
            
        except Exception as e:
            logger.error(f"❌ Error formatting events: {e}")
            return {'keyDates': [], 'topics': [], 'events': []}
    
    @staticmethod
    def validate_canvas_url(url: str) -> bool:
        """Validate that the URL is a valid Canvas calendar feed"""
        try:
            if not url:
                return False
            
            # Check if it's a valid Canvas calendar URL
            if 'canvas' not in url.lower():
                logger.warning(f"⚠️ URL doesn't appear to be from Canvas: {url}")
                return False
            
            if 'feeds/calendars' not in url:
                logger.warning(f"⚠️ URL doesn't appear to be a Canvas calendar feed: {url}")
                return False
            
            # Try to fetch it
            response = requests.head(url, timeout=5, allow_redirects=True)
            if response.status_code == 200:
                logger.info(f"✅ Canvas calendar URL is valid")
                return True
            else:
                logger.warning(f"⚠️ Canvas calendar URL returned status {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error validating Canvas URL: {e}")
            return False
