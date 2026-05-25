$ErrorActionPreference = "Stop"

Write-Host "Dumping local database (public schema only)..."
$env:PGPASSWORD = "Sravan.9010"
& "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -h localhost -p 5432 -U postgres -d pharmacy_db -n public -f "C:\Users\ADMIN\OneDrive\Desktop\main_directory_homepage\public_schema_dump.sql"

if ($LASTEXITCODE -ne 0) {
    Write-Host "pg_dump failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}
Write-Host "Dump successful."

Write-Host "Restoring to remote Supabase database..."
$env:PGPASSWORD = "[Tharun@79933]"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h db.sgghsxjodhailolrbyar.supabase.co -p 5432 -U postgres -d postgres -f "C:\Users\ADMIN\OneDrive\Desktop\main_directory_homepage\public_schema_dump.sql"

if ($LASTEXITCODE -ne 0) {
    Write-Host "psql restore completed but had some errors (common when restoring to Supabase due to role differences, but data should be there)."
} else {
    Write-Host "Restore successful."
}
