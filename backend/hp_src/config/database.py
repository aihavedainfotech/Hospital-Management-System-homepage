import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool
import os
import atexit

# Uses DATABASE_URL from the unified backend environment exclusively.
# Individual DB_* vars are kept as fallback only.
_DATABASE_URL = os.environ.get('DATABASE_URL', '')

_pool = None

def _init_pool():
    global _pool
    if _pool is not None:
        return
    try:
        if _DATABASE_URL:
            _pool = SimpleConnectionPool(1, 10, dsn=_DATABASE_URL, connect_timeout=3)
        else:
            _pool = SimpleConnectionPool(1, 10,
                host=os.environ.get('DB_HOST', 'aws-1-ap-northeast-1.pooler.supabase.com'),
                port=int(os.environ.get('DB_PORT', 6543)),
                database=os.environ.get('DB_NAME', 'postgres'),
                user=os.environ.get('DB_USER', ''),
                password=os.environ.get('DB_PASS', ''),
                sslmode='require',
                connect_timeout=3
            )
    except Exception as e:
        print(f"Failed to initialize connection pool: {e}")

_init_pool()

@atexit.register
def _close_pool():
    if _pool is not None:
        _pool.closeall()

class DatabaseConfig:
    def get_connection(self):
        if _pool is None:
            _init_pool()
        if _pool:
            return _pool.getconn()
        return None

    def release_connection(self, conn):
        if _pool and conn:
            _pool.putconn(conn)

    def execute_query(self, query, params=None, fetch_all=True):
        conn = None
        try:
            conn = self.get_connection()
            if not conn:
                raise Exception("Could not get connection from pool")
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute(query, params)
            query_upper = query.strip().upper()
            result = None
            if query_upper.startswith('SELECT') or 'RETURNING' in query_upper:
                result = cursor.fetchall() if fetch_all else cursor.fetchone()
            if not query_upper.startswith('SELECT'):
                conn.commit()
                if result is None:
                    result = {'affected_rows': cursor.rowcount}
            return result
        except Exception as e:
            if conn:
                conn.rollback()
            print(f"Query execution error: {e}")
            raise e
        finally:
            if conn:
                self.release_connection(conn)

# Global database instance
db = DatabaseConfig()
