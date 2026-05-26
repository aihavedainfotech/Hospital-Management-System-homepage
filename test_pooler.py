import psycopg2

urls_to_test = [
    "postgresql://postgres.sgghsxjodhailolrbyar:Tharun%4079933@aws-1-us-west-1.pooler.supabase.com:5432/postgres"
]

for url in urls_to_test:
    try:
        print(f"Testing {url.split('@')[1]}...")
        conn = psycopg2.connect(dsn=url, connect_timeout=3)
        print("SUCCESS! This is the right URL:", url)
        break
    except Exception as e:
        print("FAILED:", str(e).split('\n')[0])
