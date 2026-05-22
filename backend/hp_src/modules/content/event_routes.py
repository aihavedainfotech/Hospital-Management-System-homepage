from flask import Blueprint, request, jsonify
from hp_src.modules.content.event_model import EventNews

events_bp = Blueprint('events', __name__)

@events_bp.route('', methods=['GET'])
def get_all_events():
    """Get all events and news"""
    try:
        events = EventNews.get_all()
        return jsonify({
            'success': True,
            'data': events,
            'count': len(events)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@events_bp.route('/<string:category>', methods=['GET'])
def get_events_by_category(category):
    """Get events/news by category"""
    try:
        events = EventNews.get_by_category(category)
        return jsonify({
            'success': True,
            'data': events,
            'count': len(events),
            'category': category
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@events_bp.route('', methods=['POST'])
def create_event():
    """Create new event/news"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'datetime', 'category']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Validate category
        valid_categories = ['Event', 'News', 'Achievement']
        if data['category'] not in valid_categories:
            return jsonify({
                'success': False,
                'error': f'Invalid category. Must be one of: {valid_categories}'
            }), 400
        
        event = EventNews.create(data)
        return jsonify({
            'success': True,
            'data': event,
            'message': f'{data["category"]} created successfully'
        }), 201
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@events_bp.route('/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    """Update event/news"""
    try:
        data = request.get_json()
        event = EventNews.update(event_id, data)
        
        if event:
            return jsonify({
                'success': True,
                'data': event,
                'message': 'Event updated successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Event not found'
            }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@events_bp.route('/<int:event_id>', methods=['GET'])
def get_event_by_id(event_id):
    """Get event/news by ID"""
    try:
        event = EventNews.get_by_id(event_id)
        if event:
            return jsonify({
                'success': True,
                'data': event
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Event not found'
            }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@events_bp.route('/ticker', methods=['GET'])
def get_ticker_data():
    """Get ticker data (recent events and news)"""
    try:
        limit = request.args.get('limit', 10, type=int)
        events = EventNews.get_recent(limit)
        
        ticker_items = []
        for event in events:
            # Enhanced icon mapping
            category_lower = event.get('category', '').lower()
            if 'news' in category_lower:
                icon = 'fas fa-newspaper'
            elif 'event' in category_lower:
                icon = 'fas fa-calendar-alt'
            elif 'achievement' in category_lower:
                icon = 'fas fa-trophy'
            else:
                icon = 'fas fa-bullhorn'
                
            # Handle datetime formatting safely
            event_datetime = event['datetime']
            if isinstance(event_datetime, str):
                from datetime import datetime
                try:
                    dt = datetime.fromisoformat(event_datetime.replace('Z', '+00:00'))
                    date_str = dt.strftime('%Y-%m-%d')
                except:
                    date_str = event_datetime.split('T')[0] if 'T' in event_datetime else event_datetime
            else:
                date_str = str(event_datetime)
            
            ticker_items.append({
                'icon': icon,
                'text': f"{event['title']} - {date_str}"
            })
        
        return jsonify({
            'success': True,
            'data': ticker_items,
            'count': len(ticker_items)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
