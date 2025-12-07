# Database Restore Script for Supabase
# Usage: .\restore-database.ps1 -BackupFile "tikrar_backup_20251207_143000.sql.gz"
# Example: .\restore-database.ps1 -BackupFile "D:\backups\supabase\tikrar_backup_20251207_143000.sql.gz"

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,

    [switch]$DryRun = $false,
    [switch]$Force = $false
)

# Configuration
$ProjectRef = "nmbvklixthlqtkkgqnjl"
$TempDir = "D:\temp\restore"
$LogFile = "D:\logs\restore_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# Create temp directory
if (-not (Test-Path $TempDir)) {
    New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
}

# Create log directory
if (-not (Test-Path "D:\logs")) {
    New-Item -ItemType Directory -Path "D:\logs" -Force | Out-Null
}

# Logging function
function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] $Message"
    Write-Host $LogEntry -ForegroundColor Yellow
    Add-Content -Path $LogFile -Value $LogEntry
}

# Warning message
function Write-Warning {
    param([string]$Message)
    Write-Host "WARNING: $Message" -ForegroundColor Red
}

# Check if PostgreSQL tools are installed
try {
    $pg_restore = Get-Command pg_restore -ErrorAction Stop
    $psql = Get-Command psql -ErrorAction Stop
    Write-Log "PostgreSQL tools found"
} catch {
    Write-Log "ERROR: PostgreSQL tools not found!"
    exit 1
}

# Validate backup file
if (-not (Test-Path $BackupFile)) {
    Write-Log "ERROR: Backup file not found: $BackupFile"
    exit 1
}

# Get database password
Write-Log "Enter Supabase database password:"
$SecurePassword = Read-Host -AsSecureString
$Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword))

# Build connection string
$ConnectionString = "postgresql://postgres.$($ProjectRef):$($Password)@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

# Show current database info
Write-Log "Current database information:"
$TablesBefore = & psql "$ConnectionString" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>$null
$UsersBefore = & psql "$ConnectionString" -t -c "SELECT COUNT(*) FROM users;" 2>$null
Write-Log "  Tables: $($TablesBefore.Trim())"
Write-Log "  Users: $($UsersBefore.Trim())"

# Extract backup if compressed
if ($BackupFile.EndsWith('.gz')) {
    Write-Log "Extracting compressed backup..."
    $ExtractedFile = Join-Path $TempDir (Split-Path $BackupFile -LeafBase) + ".sql"

    try {
        Expand-Archive -Path $BackupFile -DestinationPath $TempDir -Force
        $ExtractedPath = Join-Path $TempDir (Split-Path $BackupFile -LeafBase) + ".sql"

        if (-not (Test-Path $ExtractedPath)) {
            # Try alternative extraction method
            Write-Log "Trying alternative extraction method..."
            $7zip = Get-Command 7z -ErrorAction SilentlyContinue
            if ($7zip) {
                & $7z.Source e $BackupFile "-o$TempDir" -y 2>$null
            } else {
                Write-Log "ERROR: Cannot extract file. Please install 7-Zip or use .sql file."
                exit 1
            }
        }
    } catch {
        Write-Log "ERROR: Failed to extract backup file: $($_.Exception.Message)"
        exit 1
    }

    # Find the extracted SQL file
    $SqlFiles = Get-ChildItem -Path $TempDir -Filter "*.sql"
    if ($SqlFiles.Count -eq 0) {
        Write-Log "ERROR: No SQL file found after extraction"
        exit 1
    }
    $SqlFile = $SqlFiles[0].FullName
} else {
    $SqlFile = $BackupFile
}

# Show backup file info
$BackupSize = (Get-Item $SqlFile).Length / 1MB
$LineCount = (Get-Content $SqlFile | Measure-Object -Line).Lines
Write-Log "Backup file: $SqlFile"
Write-Log "  Size: $([math]::Round($BackupSize, 2)) MB"
Write-Log "  Lines: $LineCount"

# Check backup content
Write-Log "Checking backup content..."
$BackupTables = Select-String -Path $SqlFile -Pattern "CREATE TABLE" | Measure-Object | Select-Object -ExpandProperty Count
$BackupUsers = Select-String -Path $SqlFile -Pattern "INSERT INTO users" | Measure-Object | Select-Object -ExpandProperty Count
Write-Log "  Tables in backup: $BackupTables"
Write-Log "  User records in backup: $BackupUsers"

# Dry run - just check if restore would work
if ($DryRun) {
    Write-Log "DRY RUN: Checking if backup can be restored..."

    # Check syntax
    $SyntaxCheck = & psql "$ConnectionString" --set ON_ERROR_STOP=1 -f $SqlFile 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Log "✓ Backup syntax is valid"
    } else {
        Write-Log "✗ Backup has syntax errors:"
        Write-Log $SyntaxCheck
    }

    # Clean up
    if ($BackupFile.EndsWith('.gz')) {
        Remove-Item $SqlFile -Force
    }

    Write-Log "Dry run completed. No changes made to database."
    exit 0
}

# Warning before restore
if (-not $Force) {
    Write-Warning "THIS WILL OVERWRITE YOUR ENTIRE DATABASE!"
    Write-Warning "All current data will be lost!"
    Write-Host ""
    Write-Host "Current database has $($UsersBefore.Trim()) users"
    Write-Host "Backup has $BackupUsers users"
    Write-Host ""
    Write-Host "Type 'yes' to continue with restore, or anything else to cancel: " -NoNewline -ForegroundColor Red
    $Confirm = Read-Host

    if ($Confirm -ne 'yes') {
        Write-Log "Restore cancelled by user"
        if ($BackupFile.EndsWith('.gz')) {
            Remove-Item $SqlFile -Force
        }
        exit 0
    }
}

# Perform restore
Write-Log "Starting database restore..."
$Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

try {
    # Drop all tables
    Write-Log "Dropping existing tables..."
    & psql "$ConnectionString" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" 2>&1

    # Restore from backup
    Write-Log "Restoring from backup..."
    & psql "$ConnectionString" --set ON_ERROR_STOP=1 -f $SqlFile 2>&1

    $Stopwatch.Stop()

    if ($LASTEXITCODE -eq 0) {
        Write-Log "✓ Restore completed successfully!"
        Write-Log "  Duration: $($Stopwatch.Elapsed.TotalSeconds) seconds"

        # Verify restore
        Write-Log "Verifying restored data..."
        $TablesAfter = & psql "$ConnectionString" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>$null
        $UsersAfter = & psql "$ConnectionString" -t -c "SELECT COUNT(*) FROM users;" 2>$null

        Write-Log "Database after restore:"
        Write-Log "  Tables: $($TablesAfter.Trim())"
        Write-Log "  Users: $($UsersAfter.Trim())"

        # Check specific tables
        $CriticalTables = @('users', 'batches', 'programs', 'pendaftaran_tikrar_tahfidz')
        foreach ($Table in $CriticalTables) {
            $Count = & psql "$ConnectionString" -t -c "SELECT COUNT(*) FROM $Table;" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Log "  $Table: $($Count.Trim()) records"
            }
        }

        Write-Log ""
        Write-Log "=== Restore Complete ==="
    } else {
        Write-Log "✗ Restore failed!"
        exit 1
    }
} catch {
    Write-Log "✗ Error during restore: $($_.Exception.Message)"
    exit 1
} finally {
    # Clean up
    if ($BackupFile.EndsWith('.gz') -and (Test-Path $SqlFile)) {
        Remove-Item $SqlFile -Force
        Write-Log "Cleaned up temporary files"
    }
}

# Instructions for next steps
Write-Log ""
Write-Log "Next steps:"
Write-Log "1. Test application functionality"
Write-Log "2. Check user access"
Write-Log "3. Verify data integrity"
Write-Log "4. Update application if schema changed"