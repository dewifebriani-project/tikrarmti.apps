# Setup Automatic Backup on Windows

## Prerequisites
✅ PostgreSQL 17 sudah terinstall di: `C:\Program Files\PostgreSQL\17\bin\`

## Langkah 1: Set Environment Variable

Buka Command Prompt sebagai Administrator dan jalankan:
```cmd
setx SUPABASE_DB_PASSWORD "your_password_here" /M
```

Atau melalui GUI:
1. Tekan `Win + R`, ketik `sysdm.cpl`
2. Tab Advanced → Environment Variables
3. System Variables → New
4. Variable name: `SUPABASE_DB_PASSWORD`
5. Variable value: `<password database Supabase Anda>`

## Langkah 2: Buat Final Backup Script

Buat file `backup-database-final.ps1`:
```powershell
# Final Automated Backup Script
$env:SUPABASE_DB_PASSWORD = [System.Environment]::GetEnvironmentVariable("SUPABASE_DB_PASSWORD", "Machine")
& "D:\tikrarmti.apps\scripts\backup-test.ps1"
```

## Langkah 3: Setup Windows Task Scheduler

1. **Buka Task Scheduler**
   - Tekan `Win + S`, ketik "Task Scheduler"
   - Buka sebagai Administrator

2. **Create Basic Task**
   - Klik "Create Basic Task" di Actions panel
   - Name: `Supabase Daily Backup`
   - Description: `Backup database Supabase tikrarmti.apps`

3. **Trigger**
   - Select: `Daily`
   - Start time: `2:00:00 AM`
   - Recur every: `1 Day`

4. **Action**
   - Select: `Start a program`
   - Program/script: `powershell.exe`
   - Add arguments: `-ExecutionPolicy Bypass -File "D:\tikrarmti.apps\scripts\backup-database-final.ps1"`
   - Start in: `D:\tikrarmti.apps\scripts\`

5. **Finish**
   - Check: `Open the Properties dialog for this task when I click Finish`
   - Klik Finish

6. **Advanced Settings**
   - Di tab General:
     - ✅ Run whether user is logged on or not
     - ✅ Run with highest privileges
   - Di tab Settings:
     - ✅ Allow task to be run on demand
     - ✅ Stop task if runs longer than: 1 hour
   - Klik OK (masukkan password Windows jika diminta)

## Langkah 4: Test Backup Manual

Jalankan script backup:
```powershell
cd D:\tikrarmti.apps\scripts
powershell -ExecutionPolicy Bypass -File backup-test.ps1
```

Atau test via Task Scheduler:
1. Buka Task Scheduler
2. Cari task "Supabase Daily Backup"
3. Right-click → Run
4. Check di: `D:\backups\supabase\`

## Langkah 5: Verify Backup

Check backup files:
```cmd
dir D:\backups\supabase\*.gz
```

Check log file:
```cmd
type D:\logs\backup.log
```

## Cara Restore Database

1. **Extract backup**:
   ```powershell
   cd D:\backups\supabase
   Expand-Archive -Path "tikrar_backup_YYYYMMDD_HHMMSS.sql.gz" -DestinationPath "D:\temp\restore"
   ```

2. **Restore database**:
   ```cmd
   set PGPASSWORD=your_password
   psql -h aws-0-ap-southeast-1.pooler.supabase.com -p 6543 -U postgres.nmbvklixthlqtkkgqnjl -d postgres -f "D:\temp\restore\tikrar_backup_YYYYMMDD_HHMMSS.sql"
   ```

**⚠️ Warning: Restore akan overwrite semua data!**

## Monitoring

### Check Backup Status
```powershell
# Check last 7 days
Get-ChildItem D:\backups\supabase\*.gz | Where-Object CreationTime -gt (Get-Date).AddDays(-7) | Sort-Object CreationTime -Descending

# Check log
Get-Content D:\logs\backup.log -Tail 20
```

### Setup Email Notification (Optional)
Tambahkan di akhir script backup:
```powershell
# Email notification
$EmailFrom = "backup@yourcompany.com"
$EmailTo = "admin@yourcompany.com"
$Subject = "Supabase Backup Report - $(Get-Date -Format 'yyyy-MM-dd')"
$Body = "Backup completed successfully. File: $CompressedPath"

Send-MailMessage -From $EmailFrom -To $EmailTo -Subject $Subject -Body $Body -SmtpServer "smtp.yourprovider.com"
```

## Best Practices

1. **Backup Multiple Locations**:
   - Local: `D:\backups\supabase\`
   - Cloud: Google Drive, OneDrive, atau AWS S3
   - Offsite: External hard drive

2. **Regular Verification**:
   - Test restore bulanan
   - Check backup size consistency
   - Monitor log files

3. **Security**:
   - Encrypt backup files jika mengandung sensitive data
   - Limit access to backup folder
   - Change password regularly

4. **Retention Policy**:
   - Keep daily backups: 7 hari
   - Keep weekly backups: 4 minggu
   - Keep monthly backups: 12 bulan

## Troubleshooting

### Common Issues:
1. **"Access denied"**
   - Run Task Scheduler as Administrator
   - Check permissions on backup folder

2. **"Connection failed"**
   - Verify database password
   - Check internet connection
   - Confirm database URL

3. **"Disk full"**
   - Clean old backups
   - Increase disk space
   - Setup monitoring alerts

### Error Codes:
- Exit code 0: Success
- Exit code 1: Error occurred
- Check log file for details