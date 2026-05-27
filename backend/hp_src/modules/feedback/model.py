from datetime import datetime
from typing import List, Dict, Any, Optional
from hp_src.config.database import db

class Complaint:
    """Feedback model class handling Complaints, Suggestions and Compliments"""
    
    @staticmethod
    def _get_table_info(feedback_type: str):
        """Map feedback type to table name and column names"""
        mapping = {
            'complaint': {
                'table': 'complaints',
                'cols': ['name', 'patient_contact', 'patient_email', 'department', 'category', 'priority', 'message', 'status', 'submitted_at'],
                'date_col': 'submitted_at'
            },
            'suggestion': {
                'table': 'suggestions',
                'cols': ['name', 'phone', 'email', 'department', 'visit_date', 'subject', 'message', 'anonymous', 'reference_number', 'status', 'created_at'],
                'date_col': 'created_at'
            },
            'compliment': {
                'table': 'compliments',
                'cols': ['name', 'phone', 'email', 'department', 'visit_date', 'subject', 'message', 'anonymous', 'reference_number', 'status', 'created_at'],
                'date_col': 'created_at'
            }
        }
        return mapping.get(feedback_type.lower())

    @staticmethod
    def _generate_next_id(table_name: str, prefix: str) -> str:
        """Generate next ID in SUG001 or CPL001 format"""
        try:
            query = f"SELECT id FROM {table_name} WHERE id LIKE %s ORDER BY id DESC LIMIT 1"
            res = db.execute_query(query, (f"{prefix}%",))
            if res and res[0]['id']:
                current_id = res[0]['id']
                numeric_part = int(current_id.replace(prefix, ''))
                return f"{prefix}{numeric_part + 1:03d}"
            return f"{prefix}001"
        except Exception as e:
            print(f"Error generating ID for {table_name}: {e}")
            import time
            return f"{prefix}{int(time.time()) % 1000:03d}"

    @staticmethod
    def create(data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new feedback in corresponding table"""
        feedback_type = data.get('type', 'complaint').lower()
        info = Complaint._get_table_info(feedback_type)
        if not info:
            raise ValueError(f"Invalid feedback type: {feedback_type}")

        # Generate reference number
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        ref_number = f"HVD-{feedback_type.upper()[:3]}-{timestamp[-6:]}"
        data['reference_number'] = ref_number
        data['status'] = data.get('status', 'pending')
        
        # Add timestamp
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        data[info['date_col']] = now

        # Map generic fields to specific table columns
        mapped_data = {}
        if feedback_type == 'complaint':
            mapped_data['name'] = data.get('name') if not data.get('anonymous') else 'Anonymous'
            mapped_data['patient_contact'] = data.get('phone')
            mapped_data['patient_email'] = data.get('email')
            mapped_data['department'] = data.get('department')
            mapped_data['category'] = data.get('category', 'complaint')
            mapped_data['priority'] = data.get('priority', 'medium')
            mapped_data['message'] = data.get('message')
            mapped_data['status'] = data['status']
            mapped_data['submitted_at'] = data[info['date_col']]
        else:
            # Handle string IDs for suggestions and compliments
            if feedback_type == 'suggestion':
                mapped_data['id'] = Complaint._generate_next_id('suggestions', 'SUG')
            elif feedback_type == 'compliment':
                mapped_data['id'] = Complaint._generate_next_id('compliments', 'CPL')

            for col in info['cols']:
                if col != 'id':
                    val = data.get(col)
                    if col == 'visit_date' and val == '':
                        val = None
                    mapped_data[col] = val
            
            if data.get('anonymous'):
                mapped_data['name'] = 'Anonymous'
            mapped_data['reference_number'] = ref_number
            mapped_data[info['date_col']] = data[info['date_col']]

        cols = list(mapped_data.keys())
        placeholders = ', '.join(['%s'] * len(cols))
        query = f"INSERT INTO {info['table']} ({', '.join(cols)}) VALUES ({placeholders}) RETURNING id"
        
        result = db.execute_query(query, tuple(mapped_data.values()), fetch_all=False)
        return {
            'id': result['id'],
            'reference_number': ref_number
        }

    @staticmethod
    def get_all(feedback_type: str = 'complaint') -> List[Dict[str, Any]]:
        """Get all feedback of a specific type"""
        info = Complaint._get_table_info(feedback_type)
        if not info: return []
        query = f"SELECT * FROM {info['table']} ORDER BY {info['date_col']} DESC"
        return db.execute_query(query)

    @staticmethod
    def get_by_reference(feedback_type: str, reference_number: str) -> Optional[Dict[str, Any]]:
        """Get feedback by reference number"""
        info = Complaint._get_table_info(feedback_type)
        if not info or feedback_type == 'complaint': # complaints table doesn't have reference_number col in default setup.sql but I added it in some places?
            # Looking at Step 130, complaints has: id, name, patient_contact, patient_email, department, category, priority, message, status, submitted_at, resolved_at. 
            # NO reference_number.
            if feedback_type == 'complaint':
                return db.execute_query(f"SELECT * FROM complaints WHERE id::text = %s", (reference_number,), fetch_all=False)
            return None
            
        query = f"SELECT * FROM {info['table']} WHERE reference_number = %s"
        return db.execute_query(query, (reference_number,), fetch_all=False)

    @staticmethod
    def update_status(feedback_type: str, feedback_id: int, status: str) -> Optional[Dict[str, Any]]:
        """Update feedback status"""
        info = Complaint._get_table_info(feedback_type)
        if not info: return None
        query = f"UPDATE {info['table']} SET status = %s WHERE id = %s RETURNING *"
        return db.execute_query(query, (status, feedback_id), fetch_all=False)
