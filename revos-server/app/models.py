from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import json

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Google Calendar integration
    google_calendar_token = db.Column(db.Text, nullable=True)
    google_calendar_refresh_token = db.Column(db.Text, nullable=True)
    google_calendar_token_expiry = db.Column(db.DateTime, nullable=True)
    selected_calendar_id = db.Column(db.String(255), nullable=True, default='primary')
    
    # Relationship to syllabi
    syllabi = db.relationship('Syllabus', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set the password."""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if the provided password matches the hash."""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'google_calendar_connected': bool(self.google_calendar_token)
        }


class Syllabus(db.Model):
    __tablename__ = 'syllabi'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    course_id = db.Column(db.String(255), nullable=False)
    course_name = db.Column(db.String(255), nullable=False)
    instructor = db.Column(db.String(255))
    semester = db.Column(db.String(100))
    
    # Store parsed data as JSON
    key_dates = db.Column(db.JSON, nullable=True, default=list)
    topics = db.Column(db.JSON, nullable=True, default=list)
    grading_breakdown = db.Column(db.JSON, nullable=True, default=list)
    
    # Store vector IDs for Pinecone reference
    vector_ids = db.Column(db.JSON, nullable=True, default=list)
    
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'course_id': self.course_id,
            'course_name': self.course_name,
            'instructor': self.instructor,
            'semester': self.semester,
            'keyDates': self.key_dates,
            'topics': self.topics,
            'gradingBreakdown': self.grading_breakdown,
            'vector_ids': self.vector_ids,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
