"""
CA360 AI-Powered Call Analysis Module
Phase 1: Post-Call Transcription and AI Summarization
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import sqlite3

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(name)s - %(message)s'
)
logger = logging.getLogger('CA360_AI_ANALYSIS')

# Database configuration
DB_FILE = 'ca360_calling.db'

# AI Service Configuration
# You'll need to set these environment variables or configure them
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')  # For GPT-4
ASSEMBLYAI_API_KEY = os.getenv('ASSEMBLYAI_API_KEY', '')  # For transcription
GOOGLE_APPLICATION_CREDENTIALS = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', '')  # Alternative

# Initialize AI Analysis Database Schema
def init_ai_analysis_db():
    """Initialize database tables for AI analysis"""
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Transcription table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS call_transcriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                call_id TEXT NOT NULL UNIQUE,
                transcription_text TEXT,
                language_detected TEXT,
                word_count INTEGER,
                confidence_score REAL,
                processing_time REAL,
                service_used TEXT,
                status TEXT DEFAULT 'pending',
                started_at TEXT,
                completed_at TEXT,
                error_message TEXT,
                FOREIGN KEY (call_id) REFERENCES calls(call_id)
            )
        ''')
        
        # AI Summary table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS call_summaries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                call_id TEXT NOT NULL UNIQUE,
                summary TEXT,
                key_points TEXT,
                action_items TEXT,
                topics_discussed TEXT,
                sentiment_overall TEXT,
                client_satisfaction_score REAL,
                meeting_duration INTEGER,
                participants TEXT,
                generated_at TEXT,
                ai_model TEXT,
                status TEXT DEFAULT 'pending',
                FOREIGN KEY (call_id) REFERENCES calls(call_id)
            )
        ''')
        
        # Action items table (extracted from summary)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS call_action_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                call_id TEXT NOT NULL,
                action_item TEXT NOT NULL,
                assigned_to TEXT,
                due_date TEXT,
                priority TEXT,
                status TEXT DEFAULT 'pending',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                completed_at TEXT,
                FOREIGN KEY (call_id) REFERENCES calls(call_id)
            )
        ''')
        
        # Sentiment analysis table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS call_sentiment_analysis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                call_id TEXT NOT NULL,
                timestamp_seconds INTEGER,
                speaker TEXT,
                text_segment TEXT,
                sentiment TEXT,
                confidence REAL,
                emotions TEXT,
                FOREIGN KEY (call_id) REFERENCES calls(call_id)
            )
        ''')
        
        # Create indexes
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_transcription_call ON call_transcriptions(call_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_summary_call ON call_summaries(call_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_action_items_call ON call_action_items(call_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_sentiment_call ON call_sentiment_analysis(call_id)')
        
        conn.commit()
        conn.close()
        logger.info("AI Analysis database initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Error initializing AI analysis database: {e}")
        return False

# Initialize on module load
init_ai_analysis_db()

# ==================== TRANSCRIPTION SERVICE ====================

class TranscriptionService:
    """Handle audio transcription using AssemblyAI or Google Cloud"""
    
    def __init__(self):
        self.assemblyai_key = ASSEMBLYAI_API_KEY
        self.use_assemblyai = bool(self.assemblyai_key)
        
    def transcribe_audio_file(self, audio_path: str, call_id: str) -> Dict:
        """
        Transcribe audio file to text
        Returns: {success, text, language, confidence, word_count}
        """
        try:
            if not os.path.exists(audio_path):
                return {
                    'success': False,
                    'error': 'Audio file not found'
                }
            
            start_time = datetime.now()
            
            if self.use_assemblyai:
                result = self._transcribe_with_assemblyai(audio_path)
            else:
                # Fallback to basic transcription or return placeholder
                result = self._transcribe_fallback(audio_path)
            
            end_time = datetime.now()
            processing_time = (end_time - start_time).total_seconds()
            
            if result['success']:
                # Save to database
                self._save_transcription(
                    call_id=call_id,
                    text=result['text'],
                    language=result.get('language', 'en'),
                    confidence=result.get('confidence', 0.0),
                    word_count=len(result['text'].split()),
                    processing_time=processing_time,
                    service=result.get('service', 'unknown')
                )
            
            return result
            
        except Exception as e:
            logger.error(f"Error transcribing audio: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _transcribe_with_assemblyai(self, audio_path: str) -> Dict:
        """Transcribe using AssemblyAI API"""
        try:
            import requests
            
            # Upload file
            headers = {'authorization': self.assemblyai_key}
            
            with open(audio_path, 'rb') as f:
                response = requests.post(
                    'https://api.assemblyai.com/v2/upload',
                    headers=headers,
                    files={'file': f}
                )
            
            if response.status_code != 200:
                return {
                    'success': False,
                    'error': f'Upload failed: {response.status_code}'
                }
            
            upload_url = response.json()['upload_url']
            
            # Request transcription
            transcript_request = {
                'audio_url': upload_url,
                'language_detection': True,
                'speaker_labels': True,
                'sentiment_analysis': True
            }
            
            response = requests.post(
                'https://api.assemblyai.com/v2/transcript',
                headers=headers,
                json=transcript_request
            )
            
            if response.status_code != 200:
                return {
                    'success': False,
                    'error': f'Transcription request failed: {response.status_code}'
                }
            
            transcript_id = response.json()['id']
            
            # Poll for completion
            import time
            while True:
                response = requests.get(
                    f'https://api.assemblyai.com/v2/transcript/{transcript_id}',
                    headers=headers
                )
                
                result = response.json()
                status = result['status']
                
                if status == 'completed':
                    return {
                        'success': True,
                        'text': result['text'],
                        'language': result.get('language_code', 'en'),
                        'confidence': result.get('confidence', 0.0),
                        'service': 'assemblyai',
                        'words': result.get('words', []),
                        'utterances': result.get('utterances', []),
                        'sentiment_data': result.get('sentiment_analysis_results', [])
                    }
                elif status == 'error':
                    return {
                        'success': False,
                        'error': result.get('error', 'Transcription failed')
                    }
                
                time.sleep(3)  # Wait 3 seconds before polling again
                
        except Exception as e:
            logger.error(f"AssemblyAI transcription error: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _transcribe_fallback(self, audio_path: str) -> Dict:
        """
        Fallback method when no API key is configured
        For testing purposes - returns placeholder
        """
        logger.warning("No transcription API configured - using fallback")
        
        # In production, you could use:
        # - Google Cloud Speech-to-Text
        # - Azure Speech Services
        # - Whisper (local processing)
        
        return {
            'success': True,
            'text': '[Transcription service not configured. Please set up AssemblyAI or Google Cloud API keys.]',
            'language': 'en',
            'confidence': 0.0,
            'service': 'fallback',
            'note': 'Configure ASSEMBLYAI_API_KEY or GOOGLE_APPLICATION_CREDENTIALS environment variable'
        }
    
    def _save_transcription(self, call_id: str, text: str, language: str,
                          confidence: float, word_count: int, 
                          processing_time: float, service: str):
        """Save transcription to database"""
        try:
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO call_transcriptions (
                    call_id, transcription_text, language_detected,
                    word_count, confidence_score, processing_time,
                    service_used, status, completed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                call_id, text, language, word_count, confidence,
                processing_time, service, 'completed',
                datetime.now().isoformat()
            ))
            
            conn.commit()
            conn.close()
            logger.info(f"Transcription saved for call: {call_id}")
            
        except Exception as e:
            logger.error(f"Error saving transcription: {e}")

# ==================== AI SUMMARIZATION SERVICE ====================

class AISummarizationService:
    """Handle AI-powered call summarization using GPT-4 or Claude"""
    
    def __init__(self):
        self.openai_key = OPENAI_API_KEY
        self.use_openai = bool(self.openai_key)
    
    def generate_call_summary(self, call_id: str, transcription: str,
                             call_metadata: Dict) -> Dict:
        """
        Generate comprehensive call summary with AI
        Returns: {summary, key_points, action_items, sentiment, topics}
        """
        try:
            if self.use_openai:
                result = self._summarize_with_openai(transcription, call_metadata)
            else:
                result = self._summarize_fallback(transcription, call_metadata)
            
            if result['success']:
                # Save to database
                self._save_summary(call_id, result)
                
                # Extract and save action items separately
                if result.get('action_items'):
                    self._save_action_items(call_id, result['action_items'])
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _summarize_with_openai(self, transcription: str, metadata: Dict) -> Dict:
        """Generate summary using OpenAI GPT-4"""
        try:
            import openai
            
            openai.api_key = self.openai_key
            
            # Craft detailed prompt for CA consultation context
            prompt = f"""You are an AI assistant helping a Chartered Accountant (CA) firm in India analyze client consultation calls.

Call Details:
- Duration: {metadata.get('duration', 'N/A')} minutes
- Participants: {metadata.get('caller_name', 'Client')} (Client) and {metadata.get('receiver_name', 'CA')} (CA)
- Date: {metadata.get('date', 'N/A')}

Transcription:
{transcription}

Please provide a comprehensive analysis in JSON format with the following structure:

{{
    "summary": "A concise 2-3 paragraph summary of the consultation",
    "key_points": ["List of 5-7 key discussion points"],
    "action_items": [
        {{
            "item": "Description of action needed",
            "assigned_to": "client" or "ca",
            "priority": "high/medium/low",
            "due_date": "estimated timeframe or specific date if mentioned"
        }}
    ],
    "topics_discussed": ["List of main topics covered"],
    "client_concerns": ["List of client's main concerns or questions"],
    "recommendations_given": ["List of CA's recommendations"],
    "next_steps": "What should happen next",
    "sentiment_overall": "positive/neutral/negative",
    "client_satisfaction_estimate": 0.0 to 1.0 score,
    "follow_up_required": true/false,
    "compliance_matters": ["Any compliance or deadline-related items mentioned"],
    "financial_figures_discussed": ["Any specific amounts or financial metrics mentioned"]
}}

Provide ONLY the JSON response, no additional text."""

            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert CA consultation analyst. Provide detailed, accurate summaries in JSON format only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            # Parse JSON response
            content = response.choices[0].message.content.strip()
            
            # Remove markdown code blocks if present
            if content.startswith('```json'):
                content = content[7:]
            if content.startswith('```'):
                content = content[3:]
            if content.endswith('```'):
                content = content[:-3]
            
            result = json.loads(content.strip())
            result['success'] = True
            result['ai_model'] = 'gpt-4'
            
            return result
            
        except Exception as e:
            logger.error(f"OpenAI summarization error: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _summarize_fallback(self, transcription: str, metadata: Dict) -> Dict:
        """
        Fallback summary when no API is configured
        Provides basic rule-based summary
        """
        logger.warning("No AI API configured - using fallback summary")
        
        word_count = len(transcription.split())
        
        return {
            'success': True,
            'summary': f'Call consultation between {metadata.get("caller_name", "Client")} and {metadata.get("receiver_name", "CA")}. Duration: {metadata.get("duration", "N/A")} minutes. Transcription contains {word_count} words. [AI summarization not configured - set OPENAI_API_KEY to enable detailed analysis]',
            'key_points': ['AI summarization not configured'],
            'action_items': [],
            'topics_discussed': ['General consultation'],
            'sentiment_overall': 'neutral',
            'client_satisfaction_estimate': 0.5,
            'ai_model': 'fallback',
            'note': 'Configure OPENAI_API_KEY environment variable for AI-powered analysis'
        }
    
    def _save_summary(self, call_id: str, result: Dict):
        """Save AI summary to database"""
        try:
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO call_summaries (
                    call_id, summary, key_points, action_items,
                    topics_discussed, sentiment_overall,
                    client_satisfaction_score, ai_model,
                    generated_at, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                call_id,
                result.get('summary', ''),
                json.dumps(result.get('key_points', [])),
                json.dumps(result.get('action_items', [])),
                json.dumps(result.get('topics_discussed', [])),
                result.get('sentiment_overall', 'neutral'),
                result.get('client_satisfaction_estimate', 0.5),
                result.get('ai_model', 'unknown'),
                datetime.now().isoformat(),
                'completed'
            ))
            
            conn.commit()
            conn.close()
            logger.info(f"Summary saved for call: {call_id}")
            
        except Exception as e:
            logger.error(f"Error saving summary: {e}")
    
    def _save_action_items(self, call_id: str, action_items: List[Dict]):
        """Save extracted action items to database"""
        try:
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            
            for item in action_items:
                cursor.execute('''
                    INSERT INTO call_action_items (
                        call_id, action_item, assigned_to,
                        due_date, priority, status
                    ) VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    call_id,
                    item.get('item', ''),
                    item.get('assigned_to', ''),
                    item.get('due_date', ''),
                    item.get('priority', 'medium'),
                    'pending'
                ))
            
            conn.commit()
            conn.close()
            logger.info(f"Action items saved for call: {call_id}")
            
        except Exception as e:
            logger.error(f"Error saving action items: {e}")

# ==================== MAIN PROCESSING FUNCTION ====================

def process_call_recording(call_id: str, recording_path: str, 
                          call_metadata: Dict) -> Dict:
    """
    Main function to process call recording:
    1. Transcribe audio
    2. Generate AI summary
    3. Extract action items
    4. Analyze sentiment
    """
    try:
        logger.info(f"Starting AI analysis for call: {call_id}")
        
        results = {
            'call_id': call_id,
            'transcription': None,
            'summary': None,
            'success': False
        }
        
        # Step 1: Transcribe audio
        transcription_service = TranscriptionService()
        transcription_result = transcription_service.transcribe_audio_file(
            recording_path, call_id
        )
        
        if not transcription_result['success']:
            logger.error(f"Transcription failed for {call_id}: {transcription_result.get('error')}")
            return results
        
        results['transcription'] = transcription_result
        transcription_text = transcription_result['text']
        
        # Step 2: Generate AI summary
        summarization_service = AISummarizationService()
        summary_result = summarization_service.generate_call_summary(
            call_id, transcription_text, call_metadata
        )
        
        if not summary_result['success']:
            logger.error(f"Summarization failed for {call_id}: {summary_result.get('error')}")
            # Transcription still successful, so partial success
            results['success'] = True
            return results
        
        results['summary'] = summary_result
        results['success'] = True
        
        logger.info(f"AI analysis completed successfully for call: {call_id}")
        
        return results
        
    except Exception as e:
        logger.error(f"Error processing call recording: {e}")
        return {
            'success': False,
            'error': str(e)
        }

# ==================== API HELPER FUNCTIONS ====================

def get_call_transcription(call_id: str) -> Optional[Dict]:
    """Get transcription for a specific call"""
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM call_transcriptions
            WHERE call_id = ?
        ''', (call_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return dict(result)
        return None
        
    except Exception as e:
        logger.error(f"Error fetching transcription: {e}")
        return None

def get_call_summary(call_id: str) -> Optional[Dict]:
    """Get AI summary for a specific call"""
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM call_summaries
            WHERE call_id = ?
        ''', (call_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            summary = dict(result)
            # Parse JSON fields
            summary['key_points'] = json.loads(summary.get('key_points', '[]'))
            summary['action_items'] = json.loads(summary.get('action_items', '[]'))
            summary['topics_discussed'] = json.loads(summary.get('topics_discussed', '[]'))
            return summary
        return None
        
    except Exception as e:
        logger.error(f"Error fetching summary: {e}")
        return None

def get_call_action_items(call_id: str) -> List[Dict]:
    """Get action items for a specific call"""
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM call_action_items
            WHERE call_id = ?
            ORDER BY priority DESC, created_at
        ''', (call_id,))
        
        results = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in results]
        
    except Exception as e:
        logger.error(f"Error fetching action items: {e}")
        return []

def search_calls_by_keyword(keyword: str, user_id: str) -> List[Dict]:
    """Search calls by keyword in transcription"""
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT c.*, t.transcription_text
            FROM calls c
            JOIN call_transcriptions t ON c.call_id = t.call_id
            WHERE (c.caller_id = ? OR c.receiver_id = ?)
            AND t.transcription_text LIKE ?
            ORDER BY c.start_time DESC
            LIMIT 20
        ''', (user_id, user_id, f'%{keyword}%'))
        
        results = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in results]
        
    except Exception as e:
        logger.error(f"Error searching calls: {e}")
        return []

logger.info("CA360 AI Analysis Module loaded successfully - Phase 1: Transcription & Summarization")