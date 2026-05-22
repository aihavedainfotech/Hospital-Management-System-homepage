from typing import List, Dict, Any, Optional
from hp_src.config.database import db

class Achievement:
    """Achievement model class"""
    
    @staticmethod
    def get_all() -> List[Dict[str, Any]]:
        """Get all achievements"""
        query = """
        SELECT id, title, value, icon, description, color, created_at
        FROM achievements 
        ORDER BY id
        """
        return db.execute_query(query)
    
    @staticmethod
    def get_by_id(achievement_id: int) -> Optional[Dict[str, Any]]:
        """Get achievement by ID"""
        query = """
        SELECT id, title, value, icon, description, color, created_at
        FROM achievements 
        WHERE id = %s
        """
        return db.execute_query(query, (achievement_id,), fetch_all=False)
    
    @staticmethod
    def create(achievement_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new achievement"""
        query = """
        INSERT INTO achievements (title, value, icon, description, color)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id, title, value, icon, description, color, created_at
        """
        params = (
            achievement_data['title'],
            achievement_data['value'],
            achievement_data.get('icon', 'fas fa-trophy'),
            achievement_data.get('description'),
            achievement_data.get('color')
        )
        return db.execute_query(query, params, fetch_all=False)
    
    @staticmethod
    def update(achievement_id: int, achievement_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update achievement"""
        set_clauses = []
        params = []
        
        for key, value in achievement_data.items():
            if key != 'id':
                set_clauses.append(f"{key} = %s")
                params.append(value)
        
        if not set_clauses:
            return Achievement.get_by_id(achievement_id)
        
        params.append(achievement_id)
        query = f"""
        UPDATE achievements 
        SET {', '.join(set_clauses)}
        WHERE id = %s
        RETURNING id, title, value, icon, description, color, created_at
        """
        return db.execute_query(query, params, fetch_all=False)
    
    @staticmethod
    def delete(achievement_id: int) -> bool:
        """Delete achievement"""
        query = "DELETE FROM achievements WHERE id = %s"
        try:
            db.execute_query(query, (achievement_id,))
            return True
        except:
            return False
