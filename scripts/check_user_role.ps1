# Set your environment variables or replace these placeholders
$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL # or "your-project-url"
$anonKey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY # or "your-anon-key"

$headers = @{
    'apikey' = $anonKey
}
$uri = "${supabaseUrl}/rest/v1/users?email=eq.dewifebriani@gmail.com"
$val = Invoke-RestMethod -Uri $uri -Headers $headers
$val | ConvertTo-Json
