import psycopg2
try:
    url = "postgresql://postgres:Tharun%4079933@db.sgghsxjodhailolrbyar.supabase.co:5432/postgres"
    conn = psycopg2.connect(dsn=url, connect_timeout=3)
    print("SUCCESS")
except Exception as e:
    print("FAILED", e)
