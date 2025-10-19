"""
Google Calendar Integration Service
Handles calendar event retrieval and management
"""

import os
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import pickle
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']

class GoogleCalendarManager:
    """Manages Google Calendar interactions"""

    @staticmethod
    def get_calendar_service(access_token: str = None):
        """Get authenticated Google Calendar service"""
        try:
            if access_token:
                credentials = Credentials(token=access_token)
                return build('calendar', 'v3', credentials=credentials)
            else:
                # For demo purposes, return None if no token available
                logger.warning("No Google Calendar credentials available")
                return None
        except Exception as e:
            logger.error(f"❌ Error getting calendar service: {e}")
            return None

    @staticmethod
    def get_week_events(access_token: str = None, start_date: datetime = None, end_date: datetime = None) -> List[Dict[str, Any]]:
        """Get calendar events for a specific week"""
        try:
            import pytz
            service = GoogleCalendarManager.get_calendar_service(access_token)
            if not service:
                logger.warning("Calendar service not available")
                return []

            # Default to current week in Central Time
            if not start_date:
                central = pytz.timezone('America/Chicago')
                today = datetime.now(central)
                start_date = today - timedelta(days=today.weekday())
                start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            
            if not end_date:
                end_date = start_date + timedelta(days=7)

            # Ensure timezone-aware datetimes for Google Calendar API
            if start_date.tzinfo is None:
                central = pytz.timezone('America/Chicago')
                start_date = central.localize(start_date)
            
            if end_date.tzinfo is None:
                central = pytz.timezone('America/Chicago')
                end_date = central.localize(end_date)

            # Format dates as RFC 3339 strings (Google Calendar API requirement)
            start_str = start_date.isoformat()
            end_str = end_date.isoformat()

            logger.info(f"🗓️ Fetching calendar events from {start_str} to {end_str}")

            # Query calendar events
            events_result = service.events().list(
                calendarId='primary',
                timeMin=start_str,
                timeMax=end_str,
                singleEvents=True,
                orderBy='startTime'
            ).execute()

            events = events_result.get('items', [])
            
            # Format events
            formatted_events = []
            for event in events:
                start = event['start'].get('dateTime', event['start'].get('date'))
                end = event['end'].get('dateTime', event['end'].get('date'))
                
                formatted_events.append({
                    'id': event.get('id'),
                    'title': event.get('summary', 'Untitled'),
                    'description': event.get('description', ''),
                    'start': start,
                    'end': end,
                    'location': event.get('location', ''),
                    'busy': event.get('transparency', 'opaque') == 'opaque',
                })

            logger.info(f"✅ Retrieved {len(formatted_events)} calendar events")
            return formatted_events

        except HttpError as error:
            logger.error(f"❌ Google Calendar API error: {error}")
            logger.debug(f"Error details: {error.content if hasattr(error, 'content') else 'No details'}")
            return []
        except Exception as e:
            logger.error(f"❌ Error getting week events: {e}")
            return []

    @staticmethod
    def get_week_events_from_calendar(access_token: str = None, calendar_id: str = 'primary', start_date: datetime = None, end_date: datetime = None) -> List[Dict[str, Any]]:
        """Get calendar events from a specific calendar"""
        try:
            import pytz
            service = GoogleCalendarManager.get_calendar_service(access_token)
            if not service:
                logger.warning("Calendar service not available")
                return []

            # Default to current week in Central Time
            if not start_date:
                central = pytz.timezone('America/Chicago')
                today = datetime.now(central)
                start_date = today - timedelta(days=today.weekday())
                start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            
            if not end_date:
                end_date = start_date + timedelta(days=7)

            # Ensure timezone-aware datetimes for Google Calendar API
            if start_date.tzinfo is None:
                central = pytz.timezone('America/Chicago')
                start_date = central.localize(start_date)
            
            if end_date.tzinfo is None:
                central = pytz.timezone('America/Chicago')
                end_date = central.localize(end_date)

            # Format dates as RFC 3339 strings (Google Calendar API requirement)
            start_str = start_date.isoformat()
            end_str = end_date.isoformat()

            logger.info(f"🗓️ Fetching calendar events from {start_str} to {end_str} (calendar: {calendar_id})")

            # Query calendar events
            events_result = service.events().list(
                calendarId=calendar_id,
                timeMin=start_str,
                timeMax=end_str,
                singleEvents=True,
                orderBy='startTime'
            ).execute()

            events = events_result.get('items', [])
            
            # Format events
            formatted_events = []
            for event in events:
                start = event['start'].get('dateTime', event['start'].get('date'))
                end = event['end'].get('dateTime', event['end'].get('date'))
                
                formatted_events.append({
                    'id': event.get('id'),
                    'title': event.get('summary', 'Untitled'),
                    'description': event.get('description', ''),
                    'start': start,
                    'end': end,
                    'location': event.get('location', ''),
                    'busy': event.get('transparency', 'opaque') == 'opaque',
                })

            logger.info(f"✅ Retrieved {len(formatted_events)} events from calendar {calendar_id}")
            return formatted_events

        except HttpError as error:
            logger.error(f"❌ Google Calendar API error: {error}")
            logger.debug(f"Error details: {error.content if hasattr(error, 'content') else 'No details'}")
            return []
        except Exception as e:
            logger.error(f"❌ Error getting week events: {e}")
            return []

    @staticmethod
    def list_calendars(access_token: str = None) -> List[Dict[str, Any]]:
        """List all available calendars for the user"""
        try:
            service = GoogleCalendarManager.get_calendar_service(access_token)
            if not service:
                logger.warning("Calendar service not available")
                return []

            # Get list of calendars
            calendar_list = service.calendarList().list().execute()
            calendars = calendar_list.get('items', [])
            
            formatted_calendars = []
            for cal in calendars:
                formatted_calendars.append({
                    'id': cal.get('id'),
                    'summary': cal.get('summary', 'Untitled Calendar'),
                    'primary': cal.get('primary', False),
                    'timeZone': cal.get('timeZone', 'UTC'),
                })

            logger.info(f"✅ Retrieved {len(formatted_calendars)} calendars")
            return formatted_calendars

        except HttpError as error:
            logger.error(f"❌ Google Calendar API error: {error}")
            return []
        except Exception as e:
            logger.error(f"❌ Error listing calendars: {e}")
            return []

    @staticmethod
    def create_event(
        access_token: str,
        title: str,
        start_time: datetime,
        end_time: datetime,
        description: str = "",
        location: str = ""
    ) -> Optional[Dict[str, Any]]:
        """Create a new calendar event"""
        try:
            service = GoogleCalendarManager.get_calendar_service(access_token)
            if not service:
                logger.warning("Calendar service not available")
                return None

            event = {
                'summary': title,
                'description': description,
                'location': location,
                'start': {
                    'dateTime': start_time.isoformat(),
                    'timeZone': 'America/Chicago',  # Texas A&M timezone
                },
                'end': {
                    'dateTime': end_time.isoformat(),
                    'timeZone': 'America/Chicago',
                },
            }

            created_event = service.events().insert(
                calendarId='primary',
                body=event
            ).execute()

            logger.info(f"✅ Created calendar event: {title}")
            return {
                'id': created_event.get('id'),
                'title': created_event.get('summary'),
                'start': created_event['start'].get('dateTime'),
                'end': created_event['end'].get('dateTime'),
            }

        except HttpError as error:
            logger.error(f"❌ Google Calendar API error: {error}")
            return None
        except Exception as e:
            logger.error(f"❌ Error creating event: {e}")
            return None
