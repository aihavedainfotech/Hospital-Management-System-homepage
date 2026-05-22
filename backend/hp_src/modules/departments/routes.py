from flask import Blueprint, jsonify
from hp_src.modules.departments.model import Department

departments_bp = Blueprint('departments', __name__)

@departments_bp.route('', methods=['GET'])
def get_all_departments():
    """Get all departments with doctor counts"""
    try:
        departments = Department.get_all()
        return jsonify({
            'success': True,
            'data': departments,
            'count': len(departments)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@departments_bp.route('/with-doctors', methods=['GET'])
def get_departments_with_doctors():
    """Get departments with doctor information"""
    try:
        departments = Department.get_with_doctors()
        return jsonify({
            'success': True,
            'data': departments,
            'count': len(departments)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
