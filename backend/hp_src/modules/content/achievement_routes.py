from flask import Blueprint, request, jsonify
from hp_src.modules.content.achievement_model import Achievement

achievements_bp = Blueprint('achievements', __name__)

@achievements_bp.route('', methods=['GET'])
def get_all_achievements():
    """Get all achievements"""
    try:
        achievements = Achievement.get_all()
        # Format for frontend
        formatted_achievements = []
        for achievement in achievements:
            formatted_achievements.append({
                'id': achievement['id'],
                'title': achievement['title'],
                'value': achievement['value'],
                'icon': achievement.get('icon', 'fas fa-trophy')
            })
        
        return jsonify({
            'success': True,
            'data': formatted_achievements,
            'count': len(formatted_achievements)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@achievements_bp.route('/<int:achievement_id>', methods=['GET'])
def get_achievement(achievement_id):
    """Get achievement by ID"""
    try:
        achievement = Achievement.get_by_id(achievement_id)
        if achievement:
            return jsonify({
                'success': True,
                'data': achievement
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Achievement not found'
            }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@achievements_bp.route('', methods=['POST'])
def create_achievement():
    """Create new achievement"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'value']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        achievement = Achievement.create(data)
        return jsonify({
            'success': True,
            'data': achievement,
            'message': 'Achievement created successfully'
        }), 201
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@achievements_bp.route('/<int:achievement_id>', methods=['PUT'])
def update_achievement(achievement_id):
    """Update achievement"""
    try:
        data = request.get_json()
        achievement = Achievement.update(achievement_id, data)
        
        if achievement:
            return jsonify({
                'success': True,
                'data': achievement,
                'message': 'Achievement updated successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Achievement not found'
            }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@achievements_bp.route('/<int:achievement_id>', methods=['DELETE'])
def delete_achievement(achievement_id):
    """Delete achievement"""
    try:
        success = Achievement.delete(achievement_id)
        if success:
            return jsonify({
                'success': True,
                'message': 'Achievement deleted successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Achievement not found'
            }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
