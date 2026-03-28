$headers = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tYnZrbGl4dGhscXRra2dxbmpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MjU4MjksImV4cCI6MjA4MDIwMTgyOX0.VoXel7lxibH89s4nVzBYniMx5A9bY6I9q_MseINFqec'
}
$uri = "https://nmbvklixthlqtkkgqnjl.supabase.co/rest/v1/users?email=eq.dewifebriani@gmail.com"
$val = Invoke-RestMethod -Uri $uri -Headers $headers
$val | ConvertTo-Json
