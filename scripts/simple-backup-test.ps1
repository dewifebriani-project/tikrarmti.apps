# Simple Backup Test Script
# Usage: powershell -ExecutionPolicy Bypass -File simple-backup-test.ps1

# Configuration
$ProjectRef = "nmbvklixthlqtkkgqnjl"
$BackupDir = "D:\backups\supabase"
$LogFile = "D:\logs\backup.log"

# Create backup directory
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

# Create log directory
if (-not (Test-Path "D:\logs")) {
    New-Item -ItemType Directory -Path "D:\logs" -Force | Out-Null
}

function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

# Check if pg_dump is installed
try {
    $pg_dump = Get-Command pg_dump -ErrorAction Stop
    Write-Log "✓ pg_dump found at: $($pg_dump.Source)"
} catch {
    Write-Log "✗ ERROR: pg_dump not found!"
    Write-Log "Please install PostgreSQL from: https://www.postgresql.org/download/windows/"
    Write-Log "During installation, select 'Command Line Tools' option"
    exit 1
}

# Prompt for password
Write-Log "Please enter your Supabase database password:"
$securePassword = Read-Host -AsSecureString
$password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword))

# Build connection string
$connectionString = "postgresql://postgres.$($ProjectRef):$($password)@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

# Test connection
Write-Log "Testing database connection..."
$testFile = "D:\temp\test_connection.txt"
try {
    $result = & psql "$connectionString" -c "SELECT 'Connection successful' as status;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Log "✓ Database connection successful"
    } else {
        Write-Log "✗ Database connection failed"
        Write-Log "Error: $result"
        exit 1
    }
} catch {
    Write-Log "✗ Error testing connection: $($_.Exception.Message)"
    exit 1
}

# Create backup
$Date = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "tikrar_backup_$($Date).sql"
$BackupPath = Join-Path $BackupDir $BackupFile

Write-Log "Creating backup: $BackupFile"
$BackupTime = Measure-Command {
    try {
        & pg_dump "$connectionString" > $BackupPath 2>&1
    } catch {
        Write-Log "✗ Error during backup: $($_.Exception.Message)"
        exit 1
    }
}

if ($LASTEXITCODE -eq 0 -and (Test-Path $BackupPath)) {
    $BackupSize = (Get-Item $BackupPath).Length / 1MB
    Write-Log "✓ Backup created successfully"
    Write-Log "  Size: $([math]::Round($BackupSize, 2)) MB"
    Write-Log "  Duration: $($BackupTime.TotalSeconds) seconds"
    Write-Log "  Location: $BackupPath"

    # Compress
    Write-Log "Compressing backup..."
    try {
        Compress-Archive -Path $BackupPath -DestinationPath "$($BackupPath).gz" -Force
        if (Test-Path "$($BackupPath).gz") {
            $CompressedSize = (Get-Item "$($BackupPath).gz").Length / 1MB
            $Reduction = [math]::Round((1 - $CompressedSize/$BackupSize) * 100, 1)
            Write-Log "✓ Backup compressed"
            Write-Log "  Compressed size: $([math]::Round($CompressedSize, 2)) MB ($Reduction% smaller)"
            Remove-Item $BackupPath -Force
        }
    } catch {
        Write-Log "✗ Compression failed: $($_.Exception.Message)"
    }
} else {
    Write-Log "✗ Backup failed (Exit code: $LASTEXITCODE)"
    if (Test-Path $BackupPath) {
        $errorLog = Get-Content $BackupPath -Raw
        Write-Log "Error details: $errorLog"
    }
    exit 1
}

# Get some statistics
try {
    $tableCount = & psql "$connectionString" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>$null
    $userCount = & psql "$connectionString" -t -c "SELECT COUNT(*) FROM users;" 2>$null
    Write-Log "Database statistics:"
    Write-Log "  Tables: $($tableCount.Trim())"
    Write-Log "  Users: $($userCount.Trim())"
} catch {
    Write-Log "Could not fetch database statistics"
}

Write-Log ""
Write-Log "=== Backup Test Complete ==="
Write-Log "To schedule this backup:"
Write-Log "1. Open Task Scheduler"
Write-Log "2. Create Basic Task"
Write-Log "3. Run: powershell.exe"
Write-Log "4. Arguments: -ExecutionPolicy Bypass -File `"$PSScriptRoot\simple-backup-test.ps1`""
Write-Log "5. Schedule: Daily at 2:00 AM"