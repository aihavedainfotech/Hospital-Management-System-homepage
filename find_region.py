import psycopg2
import sys

regions = [
    "aws-0-us-east-1", "aws-0-us-west-1", "aws-0-us-west-2",
    "aws-0-eu-west-1", "aws-0-eu-west-2", "aws-0-eu-central-1",
    "aws-0-ap-southeast-1", "aws-0-ap-southeast-2", "aws-0-ap-northeast-1",
    "aws-0-ap-northeast-2", "aws-0-ap-south-1", "aws-0-sa-east-1",
    "aws-0-ca-central-1", "aws-0-eu-south-1"
]

project_ref = "sgghsxjodhailolrbyar"
pw = "Tharun%4079933"

for region in regions:
    url = f"postgresql://postgres.{project_ref}:{pw}@{region}.pooler.supabase.com:6543/postgres"
    print(f"Testing {region}...", end=" ")
    try:
        conn = psycopg2.connect(dsn=url, connect_timeout=3)
        print("SUCCESS! THIS IS THE REGION:", region)
        print("FINAL URL:", url)
        sys.exit(0)
    except Exception as e:
        msg = str(e).split('\n')[0]
        if "timeout" in msg.lower() or "not found" in msg.lower():
            print("Failed (wrong region)")
        else:
            print("Failed (other):", msg)
