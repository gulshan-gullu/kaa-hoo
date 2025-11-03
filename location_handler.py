"""
📍 LOCATION HANDLER MODULE
Handles location sharing, live location tracking, and saved places
"""

import os
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_socketio import emit

# Create Blueprint
location_bp = Blueprint('location', __name__)

# In-memory storage for active live locations (use database in production)
active_live_locations = {}

# Saved places (in production, store in database)
saved_places = {}


# ============================================
# 📍 LOCATION SHARING ENDPOINTS
# ============================================

@location_bp.route('/api/send-location', methods=['POST'])
def send_location():
    """Send location data (current or live)"""
    try:
        data = request.get_json()
        
        from_user = data.get('from_user', 'Unknown')
        to_user = data.get('to_user', 'Unknown')
        location = data.get('location', {})
        is_live = data.get('is_live', False)
        duration = data.get('duration')
        
        if not location:
            return jsonify({'success': False, 'error': 'Location data required'}), 400
        
        lat = location.get('lat')
        lng = location.get('lng')
        address = location.get('address', f'{lat}, {lng}')
        accuracy = location.get('accuracy', 0)
        
        location_data = {
            'success': True,
            'from_user': from_user,
            'to_user': to_user,
            'location': {
                'lat': lat,
                'lng': lng,
                'address': address,
                'accuracy': accuracy
            },
            'is_live': is_live,
            'duration': duration,
            'timestamp': datetime.now().isoformat(),
            'type': 'live_location' if is_live else 'location'
        }
        
        # Store active live location
        if is_live:
            session_id = f"{from_user}_{to_user}_{datetime.now().timestamp()}"
            active_live_locations[session_id] = {
                'from_user': from_user,
                'to_user': to_user,
                'location': location,
                'duration': duration,
                'start_time': datetime.now().isoformat(),
                'last_update': datetime.now().isoformat()
            }
            location_data['session_id'] = session_id
            
            print(f"📡 [LOCATION] Live location started: {from_user} -> {to_user} for {duration} min")
        else:
            print(f"📍 [LOCATION] Location sent: {from_user} -> {to_user} at {lat}, {lng}")
        
        return jsonify(location_data), 200
        
    except Exception as e:
        print(f"❌ [LOCATION] Send error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@location_bp.route('/api/update-live-location', methods=['POST'])
def update_live_location():
    """Update live location coordinates"""
    try:
        data = request.get_json()
        
        session_id = data.get('session_id')
        location = data.get('location', {})
        
        if not session_id or session_id not in active_live_locations:
            return jsonify({'success': False, 'error': 'Invalid session'}), 400
        
        # Update location
        active_live_locations[session_id]['location'] = location
        active_live_locations[session_id]['last_update'] = datetime.now().isoformat()
        
        print(f"📡 [LOCATION] Live location updated: {session_id}")
        
        return jsonify({
            'success': True,
            'message': 'Location updated',
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        print(f"❌ [LOCATION] Update error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@location_bp.route('/api/stop-live-location', methods=['POST'])
def stop_live_location():
    """Stop live location sharing"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        user_id = data.get('user_id', 'Unknown')
        
        if session_id and session_id in active_live_locations:
            session = active_live_locations.pop(session_id)
            print(f"🛑 [LOCATION] Live location stopped: {user_id} (session: {session_id})")
        else:
            print(f"🛑 [LOCATION] {user_id} stopped live location sharing")
        
        return jsonify({
            'success': True,
            'message': 'Live location stopped',
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        print(f"❌ [LOCATION] Stop error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@location_bp.route('/api/get-live-location/<session_id>', methods=['GET'])
def get_live_location(session_id):
    """Get current live location for a session"""
    try:
        if session_id not in active_live_locations:
            return jsonify({'success': False, 'error': 'Session not found'}), 404
        
        session = active_live_locations[session_id]
        
        return jsonify({
            'success': True,
            'location': session['location'],
            'last_update': session['last_update'],
            'duration': session['duration'],
            'from_user': session['from_user']
        }), 200
        
    except Exception as e:
        print(f"❌ [LOCATION] Get error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================
# ⭐ SAVED PLACES ENDPOINTS
# ============================================

@location_bp.route('/api/saved-places', methods=['GET'])
def get_saved_places():
    """Get user's saved places"""
    try:
        user_id = request.args.get('user_id', 'default')
        
        # In production, fetch from database
        user_places = saved_places.get(user_id, [
            {
                'id': '1',
                'name': '🏠 Home',
                'address': '123 Main Street, City',
                'lat': 40.7128,
                'lng': -74.0060,
                'icon': '🏠'
            },
            {
                'id': '2',
                'name': '💼 Work',
                'address': '456 Business Ave, City',
                'lat': 40.7580,
                'lng': -73.9855,
                'icon': '💼'
            },
            {
                'id': '3',
                'name': '🏋️ Gym',
                'address': '789 Fitness Road, City',
                'lat': 40.7489,
                'lng': -73.9680,
                'icon': '🏋️'
            }
        ])
        
        return jsonify({
            'success': True,
            'places': user_places
        }), 200
        
    except Exception as e:
        print(f"❌ [LOCATION] Get places error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@location_bp.route('/api/saved-places', methods=['POST'])
def add_saved_place():
    """Add a new saved place"""
    try:
        data = request.get_json()
        
        user_id = data.get('user_id', 'default')
        place = {
            'id': str(datetime.now().timestamp()),
            'name': data.get('name'),
            'address': data.get('address'),
            'lat': data.get('lat'),
            'lng': data.get('lng'),
            'icon': data.get('icon', '📍')
        }
        
        if user_id not in saved_places:
            saved_places[user_id] = []
        
        saved_places[user_id].append(place)
        
        print(f"⭐ [LOCATION] Saved place added: {place['name']} for {user_id}")
        
        return jsonify({
            'success': True,
            'place': place
        }), 201
        
    except Exception as e:
        print(f"❌ [LOCATION] Add place error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@location_bp.route('/api/saved-places/<place_id>', methods=['DELETE'])
def delete_saved_place(place_id):
    """Delete a saved place"""
    try:
        user_id = request.args.get('user_id', 'default')
        
        if user_id in saved_places:
            saved_places[user_id] = [
                p for p in saved_places[user_id] if p['id'] != place_id
            ]
            
            print(f"🗑️ [LOCATION] Saved place deleted: {place_id} for {user_id}")
            
            return jsonify({
                'success': True,
                'message': 'Place deleted'
            }), 200
        
        return jsonify({'success': False, 'error': 'Place not found'}), 404
        
    except Exception as e:
        print(f"❌ [LOCATION] Delete place error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================
# 🗺️ GEOCODING ENDPOINTS (Optional)
# ============================================

@location_bp.route('/api/reverse-geocode', methods=['POST'])
def reverse_geocode():
    """Convert coordinates to address (mock implementation)"""
    try:
        data = request.get_json()
        lat = data.get('lat')
        lng = data.get('lng')
        
        if not lat or not lng:
            return jsonify({'success': False, 'error': 'Coordinates required'}), 400
        
        # In production, use actual geocoding API (Google Maps, OpenStreetMap, etc.)
        # For now, return mock address
        address = f"Location near {lat:.4f}, {lng:.4f}"
        
        return jsonify({
            'success': True,
            'address': address,
            'lat': lat,
            'lng': lng
        }), 200
        
    except Exception as e:
        print(f"❌ [LOCATION] Geocode error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================
# 📊 LOCATION STATISTICS
# ============================================

@location_bp.route('/api/location-stats', methods=['GET'])
def get_location_stats():
    """Get location sharing statistics"""
    try:
        stats = {
            'active_live_locations': len(active_live_locations),
            'total_saved_places': sum(len(places) for places in saved_places.values()),
            'users_with_saved_places': len(saved_places)
        }
        
        return jsonify({
            'success': True,
            'stats': stats
        }), 200
        
    except Exception as e:
        print(f"❌ [LOCATION] Stats error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================
# 🧹 CLEANUP UTILITIES
# ============================================

def cleanup_expired_sessions():
    """Remove expired live location sessions"""
    try:
        current_time = datetime.now()
        expired = []
        
        for session_id, session in active_live_locations.items():
            start_time = datetime.fromisoformat(session['start_time'])
            duration_minutes = session['duration']
            
            elapsed = (current_time - start_time).total_seconds() / 60
            
            if elapsed > duration_minutes:
                expired.append(session_id)
        
        for session_id in expired:
            active_live_locations.pop(session_id, None)
            print(f"🧹 [LOCATION] Expired session removed: {session_id}")
        
        return len(expired)
        
    except Exception as e:
        print(f"❌ [LOCATION] Cleanup error: {str(e)}")
        return 0


@location_bp.route('/api/cleanup-locations', methods=['POST'])
def cleanup_locations_endpoint():
    """Manually trigger cleanup of expired sessions"""
    try:
        count = cleanup_expired_sessions()
        
        return jsonify({
            'success': True,
            'removed_sessions': count
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500