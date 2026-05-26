from flask import Blueprint, jsonify
from hp_src.config.database import db

services_bp = Blueprint('services', __name__)

@services_bp.route('', methods=['GET'])
def get_services():
    try:
        results = db.execute_query("SELECT * FROM services ORDER BY id ASC")
        return jsonify(results), 200
    except Exception as e:
        print(f"Error fetching services: {e}")
        return jsonify({"error": "Internal server error"}), 500
