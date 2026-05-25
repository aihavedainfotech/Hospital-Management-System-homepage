import psycopg2
import sys

def test_conn(host, port, user, password, dbname):
    try:
        conn = psycopg2.connect(host=host, port=port, user=user, password=password, dbname=dbname, connect_timeout=3)
        print(f"SUCCESS: {host}:{port} db={dbname} user={user} pass={password}")
        conn.close()
        return True
    except Exception as e:
        print(f"FAIL: {host}:{port} db={dbname} user={user} pass={password} -> {e}")
        return False

# Try new DB without brackets
test_conn("db.sgghsxjodhailolrbyar.supabase.co", 5432, "postgres", "Tharun@79933", "postgres")
test_conn("aws-0-ap-south-1.pooler.supabase.com", 6543, "postgres.sgghsxjodhailolrbyar", "Tharun@79933", "postgres")
