from flask import Blueprint, request, jsonify
from hp_src.modules.feedback.model import Complaint
import sys, os
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

sys.path.insert(0, '/app/backend')
try:
    from hp_src.utils.email_service import (
        send_complaint_acknowledgment,
        send_compliment_acknowledgment,
        send_suggestion_acknowledgment
    )
    EMAIL_ENABLED = True
    print("✓ Email service imported successfully, EMAIL_ENABLED=True", file=sys.stderr, flush=True)
    logger.info("✓ Email service imported successfully, EMAIL_ENABLED=True")
except ImportError as e:
    EMAIL_ENABLED = False
    print(f"✗ Email service import failed: {e}", file=sys.stderr, flush=True)
    logger.error(f"✗ Email service import failed: {e}")
except Exception as e:
    EMAIL_ENABLED = False
    print(f"✗ Email service import failed with unexpected error: {e}", file=sys.stderr, flush=True)
    logger.error(f"✗ Email service import failed with unexpected error: {e}")

complaints_bp = Blueprint('complaints', __name__)
suggestions_bp = Blueprint('suggestions', __name__)
compliments_bp = Blueprint('compliments', __name__)

@complaints_bp.route('', methods=['GET'])
def get_all_feedback():
    """Get all feedback (admin endpoint)"""
    try:
        feedback_type = request.args.get('type', 'complaint')
        results = Complaint.get_all(feedback_type)
        return jsonify({
            'success': True,
            'data': results,
            'count': len(results)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@complaints_bp.route('', methods=['POST'])
def create_complaint():
    """Submit new complaint"""
    try:
        logger.info("=" * 60)
        logger.info("NEW COMPLAINT SUBMISSION")
        logger.info("=" * 60)
        
        data = request.get_json()
        logger.info(f"Received data: {data}")
        
        if 'message' not in data or not data['message'].strip():
            return jsonify({'success': False, 'error': 'Message is required'}), 400
        
        data['type'] = 'complaint'
        result = Complaint.create(data)
        logger.info(f"Complaint created: {result}")

        # Send acknowledgment email if email provided
        email_sent = False
        logger.info(f"EMAIL_ENABLED = {EMAIL_ENABLED}")
        
        if EMAIL_ENABLED:
            email = data.get('patient_email') or data.get('email')
            name  = data.get('name', 'Patient')
            cid   = result.get('id', 'N/A') if isinstance(result, dict) else 'N/A'
            
            logger.info(f"Email: {email}")
            logger.info(f"Name: {name}")
            logger.info(f"Complaint ID: {cid}")
            
            if email:
                try:
                    logger.info(f"Attempting to send email to {email}...")
                    email_sent = send_complaint_acknowledgment(email, name, str(cid), data['message'])
                    logger.info(f"Email send result: {email_sent}")
                except Exception as e:
                    logger.error(f"Email send failed: {e}", exc_info=True)
            else:
                logger.warning("No email provided in request data")
        else:
            logger.warning("EMAIL_ENABLED is False")

        response_data = {
            'success': True,
            'data': result,
            'message': 'Complaint submitted successfully',
            'email_sent': email_sent
        }
        logger.info(f"Returning response: {response_data}")
        logger.info("=" * 60)
        
        return jsonify(response_data), 201
        
    except Exception as e:
        logger.error(f"Error in create_complaint: {e}", exc_info=True)
        return jsonify({'success': False, 'error': str(e)}), 500

@suggestions_bp.route('', methods=['POST'])
def create_suggestion():
    """Submit new suggestion"""
    try:
        logger.info("=" * 60)
        logger.info("NEW SUGGESTION SUBMISSION")
        logger.info("=" * 60)
        
        data = request.get_json()
        logger.info(f"Received data: {data}")
        
        if 'message' not in data or not data['message'].strip():
            return jsonify({'success': False, 'error': 'Message is required'}), 400
        
        data['type'] = 'suggestion'
        result = Complaint.create(data)
        logger.info(f"Suggestion created: {result}")

        # Send acknowledgment email if email provided
        email_sent = False
        logger.info(f"EMAIL_ENABLED = {EMAIL_ENABLED}")
        
        if EMAIL_ENABLED:
            email = data.get('email')
            name  = data.get('name', 'Patient')
            sid   = result.get('id', 'N/A') if isinstance(result, dict) else 'N/A'
            
            logger.info(f"Email: {email}")
            logger.info(f"Name: {name}")
            logger.info(f"Suggestion ID: {sid}")
            
            if email:
                try:
                    logger.info(f"Attempting to send email to {email}...")
                    # Use suggestion acknowledgment email
                    email_sent = send_suggestion_acknowledgment(email, name, str(sid), data['message'])
                    logger.info(f"Email send result: {email_sent}")
                except Exception as e:
                    logger.error(f"Email send failed: {e}", exc_info=True)
            else:
                logger.warning("No email provided in request data")
        else:
            logger.warning("EMAIL_ENABLED is False")

        response_data = {
            'success': True,
            'data': result,
            'message': 'Suggestion submitted successfully',
            'email_sent': email_sent
        }
        logger.info(f"Returning response: {response_data}")
        logger.info("=" * 60)
        
        return jsonify(response_data), 201
        
    except Exception as e:
        logger.error(f"Error in create_suggestion: {e}", exc_info=True)
        return jsonify({'success': False, 'error': str(e)}), 500

@compliments_bp.route('', methods=['POST'])
def create_compliment():
    """Submit new compliment"""
    try:
        logger.info("=" * 60)
        logger.info("NEW COMPLIMENT SUBMISSION")
        logger.info("=" * 60)
        
        data = request.get_json()
        logger.info(f"Received data: {data}")
        
        if 'message' not in data or not data['message'].strip():
            return jsonify({'success': False, 'error': 'Message is required'}), 400
        
        data['type'] = 'compliment'
        result = Complaint.create(data)
        logger.info(f"Compliment created: {result}")

        # Send thank you email if email provided
        email_sent = False
        logger.info(f"EMAIL_ENABLED = {EMAIL_ENABLED}")
        
        if EMAIL_ENABLED:
            email = data.get('email')
            name  = data.get('name', 'Patient')
            cid   = result.get('id', 'N/A') if isinstance(result, dict) else 'N/A'
            
            logger.info(f"Email: {email}")
            logger.info(f"Name: {name}")
            logger.info(f"Compliment ID: {cid}")
            
            if email:
                try:
                    logger.info(f"Attempting to send email to {email}...")
                    email_sent = send_compliment_acknowledgment(email, name, str(cid), data['message'])
                    logger.info(f"Email send result: {email_sent}")
                except Exception as e:
                    logger.error(f"Email send failed: {e}", exc_info=True)
            else:
                logger.warning("No email provided in request data")
        else:
            logger.warning("EMAIL_ENABLED is False")

        response_data = {
            'success': True,
            'data': result,
            'message': 'Compliment submitted successfully',
            'email_sent': email_sent
        }
        logger.info(f"Returning response: {response_data}")
        logger.info("=" * 60)
        
        return jsonify(response_data), 201
        
    except Exception as e:
        logger.error(f"Error in create_compliment: {e}", exc_info=True)
        return jsonify({'success': False, 'error': str(e)}), 500

@complaints_bp.route('/<int:id>', methods=['PUT'])
def update_feedback_status(id):
    """Update feedback status"""
    try:
        data = request.get_json()
        feedback_type = data.get('type', 'complaint')
        status = data.get('status')
        
        if not status:
            return jsonify({'success': False, 'error': 'Status is required'}), 400
            
        result = Complaint.update_status(feedback_type, id, status)
        if result:
            return jsonify({
                'success': True,
                'data': result,
                'message': 'Status updated successfully'
            })
        else:
            return jsonify({'success': False, 'error': 'Feedback not found'}), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
