# Setup Daily Backup for Supabase Database

## Cara 1: Gunakan Built-in Supabase Backup (Recommended)

### Untuk Pro Plan:
1. Login ke Supabase Dashboard
2. Pilih project tikrarmtiapps
3. Go to **Settings** → **Database**
4. Scroll ke **Database Backups**
5. Enable daily backup (sudah otomatis untuk Pro Plan)

### Untuk Free Plan:
Upgrade ke Pro Plan untuk mendapatkan backup otomatis

---

## Cara 2: Script Backup Manual

### Linux/Mac (gunakan backup-database.sh):

1. Install PostgreSQL client:
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql
```

2. Setup script:
```bash
# Make script executable
chmod +x scripts/backup-database.sh

# Edit script dengan password database yang benar
nano scripts/backup-database.sh

# Test run
./scripts/backup-database.sh
```

3. Setup cron job untuk backup harian:
```bash
# Edit crontab
crontab -e

# Add line untuk backup jam 2 pagi setiap hari
0 2 * * * /path/to/tikrarmti.apps/scripts/backup-database.sh
```

### Windows (gunakan backup-database.ps1):

1. Install PostgreSQL client:
   - Download dari: https://www.postgresql.org/download/windows/
   - Pilih PostgreSQL 15 atau versi lebih baru
   - Install dengan opsi Command Line Tools

2. Setup script PowerShell:
```powershell
# Test script
.\scripts\backup-database.ps1

# Jika dapat error execution policy:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

3. Setup Windows Task Scheduler:
   - Buka **Task Scheduler**
   - Create Basic Task
   - Name: "Supabase Daily Backup"
   - Trigger: Daily at 2:00 AM
   - Action: Start a program
   - Program: `powershell.exe`
   - Arguments: `-ExecutionPolicy Bypass -File "C:\path\to\tikrarmti.apps\scripts\backup-database.ps1"`

---

## Cara 3: GitHub Actions Backup (Opsional)

Buat file `.github/workflows/backup.yml`:

```yaml
name: Database Backup

on:
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup PostgreSQL client
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client

      - name: Create backup
        env:
          DB_URL: ${{ secrets.SUPABASE_DB_URL }}
        run: |
          DATE=$(date +%Y%m%d_%H%M%S)
          BACKUP_FILE="tikrar_backup_${DATE}.sql"
          pg_dump $DB_URL > $BACKUP_FILE
          gzip $BACKUP_FILE

      - name: Upload backup artifact
        uses: actions/upload-artifact@v3
        with:
          name: database-backup-${{ github.run_number }}
          path: "*.sql.gz"
          retention-days: 7
```

Add secret di GitHub:
- Go to Settings → Secrets and variables → Actions
- Add `SUPABASE_DB_URL` dengan value database URL

---

## Cara 4: Backup ke Cloud Storage

### Google Drive Setup:
1. Install rclone: `sudo apt install rclone`
2. Setup: `rclone config`
3. Add ke backup script:
```bash
# Upload ke Google Drive
rclone copy $BACKUP_DIR/$COMPRESSED_FILE gdrive:/supabase-backups/
```

### AWS S3 Setup:
1. Install AWS CLI
2. Configure: `aws configure`
3. Add ke backup script:
```bash
# Upload ke S3
aws s3 cp $BACKUP_DIR/$COMPRESSED_FILE s3://your-backup-bucket/supabase/
```

---

## Monitoring Backup

1. Check log file:
```bash
tail -f /var/log/supabase_backup.log
```

2. Setup notification (Slack/Discord/Email):
   - Edit backup script bagian notification
   - Test notification setelah backup berhasil

---

## Recovery Process

Untuk restore backup:
```bash
# Uncompress backup
gunzip tikrar_backup_YYYYMMDD_HHMMSS.sql.gz

# Restore database
psql $DB_URL < tikrar_backup_YYYYMMDD_HHMMSS.sql
```

**⚠️ Warning: Restore akan overwrite data existing!**

---

## Best Practices

1. **Simpan backup di multiple lokasi:**
   - Local storage
   - Cloud storage (Google Drive, S3, dll)
   - Supabase built-in backup (Pro Plan)

2. **Test backup secara berkala:**
   - Verify file backup tidak corrupt
   - Test restore di staging environment

3. **Monitor backup failures:**
   - Setup alert jika backup gagal
   - Check log secara regular

4. **Dokumentasikan proses recovery:**
   - Simpan langkah-langkah restore
   - Include contact person untuk emergency