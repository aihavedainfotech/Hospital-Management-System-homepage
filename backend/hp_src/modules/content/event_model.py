from typing import List, Dict, Any, Optional
from hp_src.config.database import db

class EventNews:
    """Events and News model class"""
    
    @staticmethod
    def get_all() -> List[Dict[str, Any]]:
        """Get all events and news"""
        query = """
        SELECT id, title, description, event_date as datetime, type as category, created_at
        FROM news_events 
        ORDER BY event_date DESC
        """
        return db.execute_query(query)
    
    @staticmethod
    def get_by_category(category: str) -> List[Dict[str, Any]]:
        """Get events/news by category"""
        query = """
        SELECT id, title, description, event_date as datetime, type as category, created_at
        FROM news_events 
        WHERE type = %s
        ORDER BY event_date DESC
        """
        return db.execute_query(query, (category,))
    
    @staticmethod
    def get_recent(limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent events and news for ticker"""
        query = """
        SELECT title, event_date as datetime, type as category
        FROM news_events 
        ORDER BY event_date DESC 
        LIMIT %s
        """
        return db.execute_query(query, (limit,))
    
    @staticmethod
    def create(event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new event/news"""
        query = """
        INSERT INTO news_events (title, description, event_date, type)
        VALUES (%s, %s, %s, %s)
        RETURNING id, title, description, event_date as datetime, type as category, created_at
        """
        params = (
            event_data['title'],
            event_data['description'],
            event_data['datetime'],
            event_data['category'],
            event_data.get('image')
        )
        return db.execute_query(query, params, fetch_all=False)
    
    @staticmethod
    def update(event_id: int, event_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update event/news"""
        set_clauses = []
        params = []
        
        # Translate keys
        data_to_save = {}
        for k, v in event_data.items():
            if k == 'datetime': data_to_save['event_date'] = v
            elif k == 'category': data_to_save['type'] = v
            elif k != 'id' and k != 'image': data_to_save[k] = v
            
        for key, value in data_to_save.items():
            set_clauses.append(f"{key} = %s")
            params.append(value)
        
        if not set_clauses:
            return EventNews.get_by_id(event_id)
        
        params.append(event_id)
        query = f"""
        UPDATE news_events 
        SET {', '.join(set_clauses)}
        WHERE id = %s
        RETURNING id, title, description, event_date as datetime, type as category, created_at
        """
        return db.execute_query(query, params, fetch_all=False)
    
    @staticmethod
    def get_by_id(event_id: int) -> Optional[Dict[str, Any]]:
        """Get event/news by ID"""
        query = """
        SELECT id, title, description, event_date as datetime, type as category, created_at
        FROM news_events 
        WHERE id = %s
        """
        return db.execute_query(query, (event_id,), fetch_all=False)
