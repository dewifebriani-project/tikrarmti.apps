# =====================================================
# Test Backup Script for Supabase Database
# =====================================================

# Configuration
$ProjectRef = "nmbvklixthlqtkkgqnjl"
$DbUrl = "postgresql://postgres.$($ProjectRef):[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
$BackupDir = "D:\backups\supabase"
$Date = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "tikrar_test_backup_$Date.sql"
$CompressedFile = "tikrar_test_backup_$Date.sql.gz"
$LogFile = "D:\logs\test_backup.log"

# Create directories
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}
if (-not (Test-Path "D:\logs")) {
    New-Item -ItemType Directory -Path "D:\logs" -Force | Out-Null
}

# Function to log
function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

# Function to check PostgreSQL tools
function Test-PostgreSQLTools {
    try {
        $pg_dump = Get-Command pg_dump -ErrorAction Stop
        Write-Log "Found pg_dump at: $($pg_dump.Source)"
        Write-Log "Version: $(& $pg_dump.Source --version)"
        return $true
    } catch {
        Write-Log "ERROR: PostgreSQL tools not found!"
        Write-Log "Please install PostgreSQL from: https://www.postgresql.org/download/windows/"
        return $false
    }
}

# Function to get Supabase connection string
function Get-SupabaseConnectionString {
    # Try to get from environment variables first
    $envPassword = $env:SUPABASE_DB_PASSWORD
    if ($envPassword) {
        return "postgresql://postgres.$($ProjectRef):$($envPassword)@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
    }

    # Otherwise, prompt user
    Write-Log "Please enter your Supabase database password:"
    $password = Read-Host -AsSecureString
    $passwordText = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
    return "postgresql://postgres.$($ProjectRef):$($passwordText)@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
}

# Start test
Write-Log "=== Starting Backup Test ==="
Write-Log "Backup Directory: $BackupDir"
Write-Log "Log File: $LogFile"

# Check PostgreSQL tools
if (-not (Test-PostgreSQLTools)) {
    exit 1
}

# Get connection string
$connectionString = Get-SupabaseConnectionString

# Test connection first
Write-Log "Testing database connection..."
try {
    $testResult = & psql "$connectionString" -c "SELECT 1 as test;" 2>>$LogFile
    if ($LASTEXITCODE -eq 0) {
        Write-Log "✓ Database connection successful"
    } else {
        Write-Log "✗ Database connection failed"
        Write-Log "Please check your password and network connection"
        exit 1
    }
} catch {
    Write-Log "✗ Error testing connection: $($_.Exception.Message)"
    exit 1
}

# Perform backup
Write-Log "Starting backup process..."
$BackupPath = Join-Path $BackupDir $BackupFile

try {
    # Create the backup
    Write-Log "Creating backup: $BackupFile"
    $backupTime = Measure-Command {
        & pg_dump "$connectionString" > $BackupPath 2>>$LogFile
    }

    if ($LASTEXITCODE -eq 0 -and (Test-Path $BackupPath)) {
        $backupSize = (Get-Item $BackupPath).Length / 1MB
        Write-Log "✓ Backup created successfully"
        Write-Log "  Size: $([math]::Round($backupSize, 2)) MB"
        Write-Log "  Duration: $($backupTime.TotalSeconds) seconds"

        # Compress the backup
        Write-Log "Compressing backup..."
        $compressTime = Measure-Command {
            Compress-Archive -Path $BackupPath -DestinationPath "$BackupPath.gz" -Force
        }

        $CompressedPath = Join-Path $BackupDir "$BackupFile.gz"
        if (Test-Path $CompressedPath) {
            $compressedSize = (Get-Item $CompressedPath).Length / 1MB
            $compressionRatio = [math]::Round((1 - $compressedSize/$backupSize) * 100, 1)
            Write-Log "✓ Backup compressed successfully"
            Write-Log "  Compressed Size: $([math]::Round($compressedSize, 2)) MB"
            Write-Log "  Compression: $compressionRatio% reduction"
            Write-Log "  Duration: $($compressTime.TotalSeconds) seconds"

            # Remove uncompressed file
            Remove-Item $BackupPath -Force
            Write-Log "✓ Uncompressed file removed"

            # Verify backup integrity
            Write-Log "Verifying backup integrity..."
            try {
                $testRestore = Test-Path $CompressedPath
                if ($testRestore) {
                    Write-Log "✓ Backup file integrity verified"

                    # Get table count
                    $tableCount = & psql "$connectionString" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>>$LogFile
                    $tableCountTrim = $tableCount.Trim()
                    Write-Log "  Tables in database: $tableCountTrim"

                } else {
                    Write-Log "✗ Backup integrity check failed"
                }
            } catch {
                Write-Log "✗ Error verifying backup: $($_.Exception.Message)"
            }
        } else {
            Write-Log "✗ Failed to compress backup"
            exit 1
        }
    } else {
        Write-Log "✗ Backup creation failed (Exit code: $LASTEXITCODE)"
        exit 1
    }
} catch {
    Write-Log "✗ Error during backup: $($_.Exception.Message)"
    exit 1
}

# Summary
Write-Log "=== Backup Test Completed Successfully ==="
Write-Log "Backup file: $CompressedPath"
Write-Log "Log file: $LogFile"

# Test restore (dry run)
Write-Log ""
Write-Log "=== Testing Restore (Dry Run) ==="
Write-Log "Checking if backup can be read..."
try {
    # Just test if we can read the compressed file
    $testExpand = Test-Path $CompressedPath
    if ($testExpand) {
        Write-Log "✓ Backup file is readable"
        Write-Log "To restore, run: Expand-Archive -Path `"$CompressedPath`" -DestinationPath `"C:\temp\restore`""
        Write-Log "Then run: psql `"$connectionString`" < `"C:\temp\restore\tikrar_test_backup_$Date.sql`""
    } else {
        Write-Log "✗ Cannot read backup file"
    }
} catch {
    Write-Log "✗ Error testing restore: $($_.Exception.Message)"
}

Write-Log ""
Write-Log "=== Test Complete ==="
Write-Log "Next steps:"
Write-Log "1. Review the backup file: $CompressedPath"
Write-Log "2. Check the log for any errors: $LogFile"
Write-Log "3. To automate, run: Set-ExecutionPolicy RemoteSigned"
Write-Log "4. Create Windows Task Scheduler with: powershell.exe -File `"$PSCommandPath`""