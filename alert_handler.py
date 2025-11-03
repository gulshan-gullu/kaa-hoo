#!/usr/bin/env python3
"""
Alert Handler for KAA HO Chat
Handles SMS, Slack, and other alert notifications
"""

from flask import Blueprint, request, jsonify
import requests
import json
from datetime import datetime

alert_bp = Blueprint('alerts', __name__, url_prefix='/api/alerts')

# ==================== CONFIGURATION ====================

# Twilio Configuration (SMS)
TWILIO_ACCOUNT_SID = 'your_account_sid'
TWILIO_AUTH_TOKEN = 'your_auth_token'
TWILIO_PHONE_NUMBER = '+1234567890'
ALERT_PHONE_NUMBERS = ['+1234567890', '+0987654321']  # Admin phones

# Slack Configuration
SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'

# Email Configuration (using SendGrid)
SENDGRID_API_KEY = 'your_sendgrid_api_key'
ALERT_EMAILS = ['admin@your-domain.com', 'manager@your-domain.com']

# Telegram Configuration
TELEGRAM_BOT_TOKEN = 'your_bot_token'
TELEGRAM_CHAT_IDS = ['123456789']  # Your Telegram chat IDs

# ==================== SMS ALERTS (TWILIO) ====================

def send_sms_alert(message, phone_numbers=None):
    """Send SMS alert via Twilio"""
    if phone_numbers is None:
        phone_numbers = ALERT_PHONE_NUMBERS
    
    try:
        from twilio.rest import Client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        results = []
        for phone in phone_numbers:
            try:
                msg = client.messages.create(
                    body=f"🚨 KAA HO ALERT\n\n{message}",
                    from_=TWILIO_PHONE_NUMBER,
                    to=phone
                )
                results.append({'phone': phone, 'status': 'sent', 'sid': msg.sid})
                print(f"✅ SMS sent to {phone}: {msg.sid}")
            except Exception as e:
                results.append({'phone': phone, 'status': 'failed', 'error': str(e)})
                print(f"❌ SMS failed to {phone}: {e}")
        
        return results
    
    except ImportError:
        print("⚠️  Twilio not installed. Install with: pip install twilio")
        return [{'status': 'error', 'message': 'Twilio not configured'}]
    except Exception as e:
        print(f"❌ SMS error: {e}")
        return [{'status': 'error', 'message': str(e)}]


# ==================== SLACK ALERTS ====================

def send_slack_alert(title, message, severity='warning', channel=None):
    """Send alert to Slack"""
    try:
        # Color based on severity
        colors = {
            'critical': '#ff0000',
            'warning': '#ff9900',
            'info': '#0099ff'
        }
        color = colors.get(severity, '#808080')
        
        # Emoji based on severity
        emojis = {
            'critical': '🚨',
            'warning': '⚠️',
            'info': 'ℹ️'
        }
        emoji = emojis.get(severity, '📊')
        
        payload = {
            'username': 'KAA HO Alerts',
            'icon_emoji': ':rotating_light:',
            'attachments': [{
                'color': color,
                'title': f'{emoji} {title}',
                'text': message,
                'footer': 'KAA HO Chat Monitoring',
                'ts': int(datetime.now().timestamp())
            }]
        }
        
        if channel:
            payload['channel'] = channel
        
        response = requests.post(
            SLACK_WEBHOOK_URL,
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"✅ Slack alert sent: {title}")
            return {'status': 'sent'}
        else:
            print(f"❌ Slack alert failed: {response.status_code}")
            return {'status': 'failed', 'code': response.status_code}
    
    except Exception as e:
        print(f"❌ Slack error: {e}")
        return {'status': 'error', 'message': str(e)}


# ==================== EMAIL ALERTS (SENDGRID) ====================

def send_email_alert(subject, body, recipients=None):
    """Send email alert via SendGrid"""
    if recipients is None:
        recipients = ALERT_EMAILS
    
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail
        
        message = Mail(
            from_email='alerts@your-domain.com',
            to_emails=recipients,
            subject=f'🚨 KAA HO: {subject}',
            html_content=f'''
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <div style="background: #ff0000; color: white; padding: 20px;">
                    <h1>🚨 KAA HO Chat Alert</h1>
                </div>
                <div style="padding: 20px; background: #f5f5f5;">
                    <h2>{subject}</h2>
                    <div style="background: white; padding: 15px; border-radius: 5px;">
                        {body}
                    </div>
                    <p style="margin-top: 20px; color: #666;">
                        <strong>Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
                    </p>
                </div>
            </div>
            '''
        )
        
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        
        print(f"✅ Email alert sent: {subject}")
        return {'status': 'sent', 'code': response.status_code}
    
    except ImportError:
        print("⚠️  SendGrid not installed. Install with: pip install sendgrid")
        return {'status': 'error', 'message': 'SendGrid not configured'}
    except Exception as e:
        print(f"❌ Email error: {e}")
        return {'status': 'error', 'message': str(e)}


# ==================== TELEGRAM ALERTS ====================

def send_telegram_alert(message):
    """Send alert via Telegram bot"""
    try:
        results = []
        for chat_id in TELEGRAM_CHAT_IDS:
            url = f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage'
            payload = {
                'chat_id': chat_id,
                'text': f'🚨 *KAA HO ALERT*\n\n{message}',
                'parse_mode': 'Markdown'
            }
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                results.append({'chat_id': chat_id, 'status': 'sent'})
                print(f"✅ Telegram alert sent to {chat_id}")
            else:
                results.append({'chat_id': chat_id, 'status': 'failed'})
                print(f"❌ Telegram alert failed to {chat_id}")
        
        return results
    
    except Exception as e:
        print(f"❌ Telegram error: {e}")
        return [{'status': 'error', 'message': str(e)}]


# ==================== WEBHOOK ENDPOINTS ====================

@alert_bp.route('/sms', methods=['POST'])
def handle_sms_webhook():
    """Handle SMS alert webhook from Alertmanager"""
    try:
        data = request.json
        
        # Extract alert information
        alerts = data.get('alerts', [])
        
        for alert in alerts:
            alert_name = alert.get('labels', {}).get('alertname', 'Unknown')
            severity = alert.get('labels', {}).get('severity', 'warning')
            description = alert.get('annotations', {}).get('description', 'No description')
            
            # Create SMS message
            message = f"{alert_name}\n{severity.upper()}\n{description}"
            
            # Send SMS
            send_sms_alert(message)
        
        return jsonify({'status': 'success', 'alerts_processed': len(alerts)})
    
    except Exception as e:
        print(f"❌ SMS webhook error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@alert_bp.route('/slack', methods=['POST'])
def handle_slack_webhook():
    """Handle Slack alert webhook from Alertmanager"""
    try:
        data = request.json
        alerts = data.get('alerts', [])
        
        for alert in alerts:
            alert_name = alert.get('labels', {}).get('alertname', 'Unknown')
            severity = alert.get('labels', {}).get('severity', 'warning')
            description = alert.get('annotations', {}).get('description', 'No description')
            summary = alert.get('annotations', {}).get('summary', 'No summary')
            
            # Send Slack alert
            send_slack_alert(
                title=alert_name,
                message=f"**{summary}**\n\n{description}",
                severity=severity
            )
        
        return jsonify({'status': 'success', 'alerts_processed': len(alerts)})
    
    except Exception as e:
        print(f"❌ Slack webhook error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@alert_bp.route('/telegram', methods=['POST'])
def handle_telegram_webhook():
    """Handle Telegram alert webhook from Alertmanager"""
    try:
        data = request.json
        alerts = data.get('alerts', [])
        
        for alert in alerts:
            alert_name = alert.get('labels', {}).get('alertname', 'Unknown')
            severity = alert.get('labels', {}).get('severity', 'warning')
            description = alert.get('annotations', {}).get('description', 'No description')
            
            message = f"*{alert_name}*\nSeverity: {severity}\n\n{description}"
            send_telegram_alert(message)
        
        return jsonify({'status': 'success', 'alerts_processed': len(alerts)})
    
    except Exception as e:
        print(f"❌ Telegram webhook error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@alert_bp.route('/test', methods=['POST'])
def test_alerts():
    """Test all alert channels"""
    results = {
        'sms': send_sms_alert('Test alert from KAA HO Chat'),
        'slack': send_slack_alert('Test Alert', 'This is a test alert', 'info'),
        'email': send_email_alert('Test Alert', 'This is a test alert'),
        'telegram': send_telegram_alert('Test alert from KAA HO Chat')
    }
    
    return jsonify({
        'status': 'test_completed',
        'results': results
    })


# ==================== REGISTER BLUEPRINT ====================

def setup_alerts(app):
    """Register alert blueprint with Flask app"""
    app.register_blueprint(alert_bp)
    print("✅ [ALERTS] Alert handlers registered")