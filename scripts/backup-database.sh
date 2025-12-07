#!/bin/bash

# =====================================================
# Daily Backup Script for Supabase Database
# =====================================================
# Usage: ./backup-database.sh
# Schedule: Add to crontab: 0 2 * * * /path/to/backup-database.sh

# Configuration
DB_URL="postgresql://postgres.tikrarmtiapps:[YOUR_PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
BACKUP_DIR="/backups/supabase"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="tikrar_backup_${DATE}.sql"
COMPRESSED_FILE="tikrar_backup_${DATE}.sql.gz"
LOG_FILE="/var/log/supabase_backup.log"
DAYS_TO_KEEP=7

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Start backup
log "Starting database backup..."

# Create database dump
log "Creating database dump: $BACKUP_FILE"
pg_dump $DB_URL > $BACKUP_DIR/$BACKUP_FILE 2>> $LOG_FILE

# Check if backup was successful
if [ $? -eq 0 ]; then
    log "Database dump created successfully"

    # Compress the backup file
    log "Compressing backup file..."
    gzip $BACKUP_DIR/$BACKUP_FILE

    if [ -f $BACKUP_DIR/$COMPRESSED_FILE ]; then
        BACKUP_SIZE=$(du -h $BACKUP_DIR/$COMPRESSED_FILE | cut -f1)
        log "Backup compressed successfully. Size: $BACKUP_SIZE"

        # Remove old backups (keep only last 7 days)
        log "Removing old backups (older than $DAYS_TO_KEEP days)..."
        find $BACKUP_DIR -name "tikrar_backup_*.sql.gz" -mtime +$DAYS_TO_KEEP -delete

        # List remaining backups
        log "Current backups:"
        ls -lh $BACKUP_DIR/tikrar_backup_*.sql.gz >> $LOG_FILE
    else
        log "ERROR: Failed to compress backup file"
        exit 1
    fi
else
    log "ERROR: Failed to create database dump"
    exit 1
fi

# Upload to cloud storage (optional - AWS S3 example)
# log "Uploading backup to S3..."
# aws s3 cp $BACKUP_DIR/$COMPRESSED_FILE s3://your-backup-bucket/supabase/

log "Backup process completed successfully"

# Optional: Send notification
# curl -X POST -H 'Content-type: application/json' \
#   --data '{"text":"Supabase backup completed successfully"}' \
#   YOUR_SLACK_WEBHOOK_URL