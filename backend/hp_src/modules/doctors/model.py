from datetime import datetime
from typing import List, Dict, Any, Optional
from hp_src.config.database import db

class Doctor:
    """Doctor model class"""
    
    @staticmethod
    def get_all() -> List[Dict[str, Any]]:
        """Get all doctors"""
        query = """
        SELECT id, name, specialization, department, experience_years, photo, 
               available_days, timings, rating, qualification, created_at, consultation_fee,
               is_active, unavailable_dates, description
        FROM doctors 
        ORDER BY name
        """
        return db.execute_query(query)
    
    @staticmethod
    def get_by_id(doctor_id: int) -> Optional[Dict[str, Any]]:
        """Get doctor by ID"""
        query = """
        SELECT id, name, specialization, department, experience_years, photo, 
               available_days, timings, rating, qualification, created_at, consultation_fee,
               is_active, unavailable_dates, description
        FROM doctors 
        WHERE id::text = %s::text
        """
        return db.execute_query(query, (doctor_id,), fetch_all=False)
    
    @staticmethod
    def get_by_department(department: str) -> List[Dict[str, Any]]:
        """Get doctors by department"""
        query = """
        SELECT id, name, specialization, department, experience_years, photo, 
               available_days, timings, rating, qualification, created_at, consultation_fee,
               is_active, unavailable_dates, description
        FROM doctors 
        WHERE department = %s
        ORDER BY name
        """
        return db.execute_query(query, (department,))
    
    @staticmethod
    def create(doctor_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new doctor"""
        query = """
        INSERT INTO doctors (name, specialization, department, experience_years, photo, 
                           available_days, timings, rating,  qualification, consultation_fee)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, name, specialization, department, experience_years, photo, 
                  available_days, timings, rating, qualification, created_at, consultation_fee
        """
        params = (
            doctor_data['name'],
            doctor_data['specialization'],
            doctor_data['department'],
            doctor_data['experience_years'],
            doctor_data.get('photo'),
            doctor_data.get('available_days'),
            doctor_data.get('timings'),
            doctor_data.get('rating', 0.0),
            doctor_data.get('qualification'),
            doctor_data.get('consultation_fee', 500)
        )
        return db.execute_query(query, params, fetch_all=False)
    
    @staticmethod
    def update(doctor_id: int, doctor_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update doctor information"""
        set_clauses = []
        params = []
        
        for key, value in doctor_data.items():
            if key != 'id':
                set_clauses.append(f"{key} = %s")
                params.append(value)
        
        if not set_clauses:
            return Doctor.get_by_id(doctor_id)
        
        params.append(doctor_id)
        query = f"""
        UPDATE doctors 
        SET {', '.join(set_clauses)}
        WHERE id = %s
        RETURNING id, name, specialization, department, experience_years, photo, 
                  available_days, timings, rating, qualification, created_at, consultation_fee
        """
        return db.execute_query(query, params, fetch_all=False)
    
    @staticmethod
    def delete(doctor_id: int) -> bool:
        """Delete doctor"""
        query = "DELETE FROM doctors WHERE id = %s"
        try:
            db.execute_query(query, (doctor_id,))
            return True
        except:
            return False
