# =====================================================
# Daily Backup Script for Supabase Database (PowerShell)
# =====================================================
# Usage: .\backup-database.ps1
# Schedule: Use Windows Task Scheduler to run daily

# Configuration
$DbUrl = "postgresql://postgres.tikrarmtiapps:[YOUR_PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
$BackupDir = "C:\backups\supabase"
$Date = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "tikrar_backup_$Date.sql"
$CompressedFile = "tikrar_backup_$Date.sql.gz"
$LogFile = "C:\logs\supabase_backup.log"
$DaysToKeep = 7

# Create backup directory if not exists
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

# Create log directory if not exists
$logDir = Split-Path $LogFile -Parent
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

# Function to log messages
function Log-Message {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

# Start backup
Log-Message "Starting database backup..."

# Check if pg_dump is available
try {
    $pgDumpVersion = & pg_dump --version 2>$null
    Log-Message "Using pg_dump: $pgDumpVersion"
} catch {
    Log-Message "ERROR: pg_dump not found. Please install PostgreSQL client tools."
    exit 1
}

# Create database dump
Log-Message "Creating database dump: $BackupFile"
$BackupPath = Join-Path $BackupDir $BackupFile

try {
    & pg_dump $DbUrl > $BackupPath 2>> $LogFile
    if ($LASTEXITCODE -eq 0) {
        Log-Message "Database dump created successfully"

        # Compress the backup file
        Log-Message "Compressing backup file..."
        Compress-Archive -Path $BackupPath -DestinationPath "$BackupPath.gz" -Force

        $CompressedPath = Join-Path $BackupDir "$BackupFile.gz"
        if (Test-Path $CompressedPath) {
            $BackupSize = (Get-Item $CompressedPath).Length / 1MB
            Log-Message "Backup compressed successfully. Size: $([math]::Round($BackupSize, 2)) MB"

            # Remove the uncompressed file
            Remove-Item $BackupPath -Force

            # Remove old backups
            Log-Message "Removing old backups (older than $DaysToKeep days)..."
            Get-ChildItem -Path $BackupDir -Filter "tikrar_backup_*.sql.gz" |
                Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-$DaysToKeep) } |
                Remove-Item -Force

            # List remaining backups
            Log-Message "Current backups:"
            Get-ChildItem -Path $BackupDir -Filter "tikrar_backup_*.sql.gz" |
                ForEach-Object {
                    $Size = $_.Length / 1MB
                    Log-Message "  $($_.Name) - $([math]::Round($Size, 2)) MB"
                }
        } else {
            Log-Message "ERROR: Failed to compress backup file"
            exit 1
        }
    } else {
        Log-Message "ERROR: Failed to create database dump (Exit code: $LASTEXITCODE)"
        exit 1
    }
} catch {
    Log-Message "ERROR: Exception occurred during backup: $($_.Exception.Message)"
    exit 1
}

# Optional: Upload to cloud storage (Azure Blob Storage example)
# Log-Message "Uploading backup to Azure Blob Storage..."
# $StorageAccountName = "yourstorageaccount"
# $ContainerName = "backups"
# $StorageKey = "YourStorageKey"
#
# az storage blob upload --file $CompressedPath `
#     --container-name $ContainerName `
#     --name "supabase/$(Split-Path $CompressedPath -Leaf)" `
#     --account-name $StorageAccountName `
#     --account-key $StorageKey

Log-Message "Backup process completed successfully"

# Optional: Send email notification
# $SmtpServer = "smtp.gmail.com"
# $SmtpPort = 587
# $SmtpUser = "your-email@gmail.com"
# $SmtpPassword = "your-app-password"
# $Recipient = "admin@yourcompany.com"
#
# $Subject = "Supabase Backup Completed - $Date"
# $Body = "Database backup completed successfully. File: $CompressedFile"
#
# Send-MailMessage -From $SmtpUser -To $Recipient -Subject $Subject -Body $Body `
#     -SmtpServer $SmtpServer -Port $SmtpPort -UseSsl -Credential (New-Object System.Management.Automation.PSCredential($SmtpUser, (ConvertTo-SecureString $SmtpPassword -AsPlainText -Force)))