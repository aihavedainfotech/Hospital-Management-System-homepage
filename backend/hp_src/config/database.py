import psycopg2
from psycopg2.extras import RealDictCursor
import os

# Uses DATABASE_URL from the unified backend environment exclusively.
# Individual DB_* vars are kept as fallback only.
_DATABASE_URL = os.environ.get('DATABASE_URL', '')


def _get_conn():
    """Open a direct connection. pgBouncer (port 6543) handles server-side pooling."""
    if _DATABASE_URL:
        # Add connect_timeout so it doesn't hang for 2 minutes if IP is unreachable
        return psycopg2.connect(dsn=_DATABASE_URL, connect_timeout=3)
    # Fallback to individual vars
    return psycopg2.connect(
        host=os.environ.get('DB_HOST', 'aws-1-ap-northeast-1.pooler.supabase.com'),
        port=int(os.environ.get('DB_PORT', 6543)),
        database=os.environ.get('DB_NAME', 'postgres'),
        user=os.environ.get('DB_USER', ''),
        password=os.environ.get('DB_PASS', ''),
        sslmode='require',
        connect_timeout=3
    )


class DatabaseConfig:
    """Thin wrapper — no local pool, relies on Supabase pgBouncer (port 6543)."""

    def get_connection(self):
        return _get_conn()

    def release_connection(self, conn):
        if conn:
            try:
                conn.close()
            except Exception:
                pass

    def execute_query(self, query, params=None, fetch_all=True):
        conn = None
        try:
            conn = _get_conn()
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
                conn.close()


# Global database instance
db = DatabaseConfig()
