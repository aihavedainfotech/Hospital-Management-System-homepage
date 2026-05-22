from typing import List, Dict, Any
from hp_src.config.database import db

class Department:
    """Department model class"""
    
    @staticmethod
    def get_all() -> List[Dict[str, Any]]:
        """Get all unique departments from doctors table"""
        query = """
        SELECT DISTINCT department as name, 
               COUNT(*) as doctor_count
        FROM doctors 
        WHERE department IS NOT NULL AND department != ''
        GROUP BY department 
        ORDER BY department
        """
        return db.execute_query(query)
    
    @staticmethod
    def get_with_doctors() -> List[Dict[str, Any]]:
        """Get departments with doctor information"""
        query = """
        SELECT DISTINCT department as name,
               COUNT(*) as doctor_count,
               STRING_AGG(name, ', ') as doctors
        FROM doctors 
        WHERE department IS NOT NULL AND department != ''
        GROUP BY department 
        ORDER BY department
        """
        return db.execute_query(query)
