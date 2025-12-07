# Backup Test Script for Supabase

# Configuration
$ProjectRef = "nmbvklixthlqtkkgqnjl"
$BackupDir = "D:\backups\supabase"
$LogFile = "D:\logs\backup.log"

# Create directories
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}
if (-not (Test-Path "D:\logs")) {
    New-Item -ItemType Directory -Path "D:\logs" -Force | Out-Null
}

# Logging function
function Log-Info {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

# Check PostgreSQL tools
Log-Info "Checking PostgreSQL tools..."
try {
    $pg_dump = Get-Command pg_dump -ErrorAction Stop
    Log-Info "Found pg_dump at: $($pg_dump.Source)"
    Log-Info "Version: $(& $pg_dump.Source --version)"
} catch {
    Log-Info "ERROR: pg_dump not found!"
    Log-Info "Please install PostgreSQL from: https://www.postgresql.org/download/windows/"
    exit 1
}

# Get password
Log-Info "Enter Supabase database password:"
$SecurePassword = Read-Host -AsSecureString
$Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword))

# Build connection string
$ConnectionString = "postgresql://postgres.$($ProjectRef):$($Password)@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

# Test connection
Log-Info "Testing database connection..."
$TestResult = & psql "$ConnectionString" -c "SELECT 1;" 2>&1
if ($LASTEXITCODE -ne 0) {
    Log-Info "ERROR: Cannot connect to database"
    Log-Info "Error: $TestResult"
    exit 1
}
Log-Info "Database connection successful"

# Create backup
$Date = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "tikrar_backup_$Date.sql"
$BackupPath = Join-Path $BackupDir $BackupFile

Log-Info "Creating backup: $BackupFile"
$Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
& pg_dump "$ConnectionString" > $BackupPath 2>&1
$Stopwatch.Stop()

if ($LASTEXITCODE -eq 0 -and (Test-Path $BackupPath)) {
    $BackupSize = (Get-Item $BackupPath).Length / 1MB
    Log-Info "Backup created successfully"
    Log-Info "Size: $([math]::Round($BackupSize, 2)) MB"
    Log-Info "Duration: $($Stopwatch.Elapsed.TotalSeconds) seconds"

    # Compress
    $CompressedPath = "$BackupPath.gz"
    Log-Info "Compressing backup..."
    Compress-Archive -Path $BackupPath -DestinationPath $CompressedPath -Force

    if (Test-Path $CompressedPath) {
        $CompressedSize = (Get-Item $CompressedPath).Length / 1MB
        $Savings = $BackupSize - $CompressedSize
        Log-Info "Compressed successfully"
        Log-Info "Compressed size: $([math]::Round($CompressedSize, 2)) MB"
        Log-Info "Space saved: $([math]::Round($Savings, 2)) MB"

        # Remove uncompressed
        Remove-Item $BackupPath -Force
        Log-Info "Backup ready: $CompressedPath"
    }
} else {
    Log-Info "ERROR: Backup failed"
    if (Test-Path $BackupPath) {
        $ErrorContent = Get-Content $BackupPath -Raw
        Log-Info "Error: $ErrorContent"
    }
    exit 1
}

# Get stats
Log-Info "Getting database statistics..."
$Tables = & psql "$ConnectionString" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>$null
$Users = & psql "$ConnectionString" -t -c "SELECT COUNT(*) FROM users;" 2>$null
Log-Info "Tables: $($Tables.Trim())"
Log-Info "Users: $($Users.Trim())"

Log-Info ""
Log-Info "=== Backup Test Complete ==="