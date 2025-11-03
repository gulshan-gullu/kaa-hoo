#!/usr/bin/env python3
"""
Automated Backup System with Monitoring for KAA HO Chat
- MySQL database backups
- File uploads backups
- Redis data backups
- Automated scheduling
- Monitoring integration
- Cloud upload (S3/Google Cloud)
"""

import os
import subprocess
import shutil
import tarfile
import gzip
from datetime import datetime, timedelta
from pathlib import Path
import json
import hashlib
from prometheus_client import Counter, Gauge, Histogram
import schedule
import time

# ==================== BACKUP METRICS ====================

backups_total = Counter(
    'backups_total',
    'Total backups performed',
    ['backup_type', 'status']  # database, files, redis | success, failure
)

backup_duration_seconds = Histogram(
    'backup_duration_seconds',
    'Backup duration',
    ['backup_type']
)

backup_size_bytes = Gauge(
    'backup_size_bytes',
    'Size of last backup',
    ['backup_type']
)

backup_age_hours = Gauge(
    'backup_age_hours',
    'Hours since last successful backup',
    ['backup_type']
)

last_backup_timestamp = Gauge(
    'last_backup_timestamp',
    'Unix timestamp of last backup',
    ['backup_type']
)

# ==================== CONFIGURATION ====================

class BackupConfig:
    # Paths
    BACKUP_DIR = 'backups'
    MYSQL_BACKUP_DIR = os.path.join(BACKUP_DIR, 'mysql')
    FILES_BACKUP_DIR = os.path.join(BACKUP_DIR, 'files')
    REDIS_BACKUP_DIR = os.path.join(BACKUP_DIR, 'redis')
    
    # MySQL Configuration
    MYSQL_HOST = 'localhost'
    MYSQL_USER = 'kaa_ho_user'
    MYSQL_PASSWORD = '123'
    MYSQL_DATABASE = 'kaa_ho'
    
    # Redis Configuration
    REDIS_HOST = 'localhost'
    REDIS_PORT = 6379
    
    # Retention (days)
    RETENTION_DAILY = 7
    RETENTION_WEEKLY = 30
    RETENTION_MONTHLY = 90
    
    # Cloud Storage (optional)
    USE_S3 = False
    S3_BUCKET = 'your-backup-bucket'
    S3_REGION = 'us-east-1'
    
    USE_GOOGLE_CLOUD = False
    GCS_BUCKET = 'your-backup-bucket'
    
    # Compression
    ENABLE_COMPRESSION = True
    COMPRESSION_LEVEL = 6
    
    # Encryption (optional)
    ENABLE_ENCRYPTION = False
    ENCRYPTION_KEY = 'your-encryption-key'


# ==================== BACKUP FUNCTIONS ====================

def create_directories():
    """Create backup directories if they don't exist"""
    for directory in [BackupConfig.BACKUP_DIR, 
                     BackupConfig.MYSQL_BACKUP_DIR,
                     BackupConfig.FILES_BACKUP_DIR,
                     BackupConfig.REDIS_BACKUP_DIR]:
        Path(directory).mkdir(parents=True, exist_ok=True)


def backup_mysql():
    """Backup MySQL database"""
    start_time = time.time()
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'mysql_backup_{timestamp}.sql'
    filepath = os.path.join(BackupConfig.MYSQL_BACKUP_DIR, filename)
    
    try:
        print(f"[BACKUP] Starting MySQL backup...")
        
        # mysqldump command
        cmd = [
            'mysqldump',
            '--host=' + BackupConfig.MYSQL_HOST,
            '--user=' + BackupConfig.MYSQL_USER,
            '--password=' + BackupConfig.MYSQL_PASSWORD,
            '--single-transaction',
            '--routines',
            '--triggers',
            '--databases', BackupConfig.MYSQL_DATABASE,
            '--result-file=' + filepath
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        
        # Compress if enabled
        if BackupConfig.ENABLE_COMPRESSION:
            compressed_file = f'{filepath}.gz'
            with open(filepath, 'rb') as f_in:
                with gzip.open(compressed_file, 'wb', compresslevel=BackupConfig.COMPRESSION_LEVEL) as f_out:
                    shutil.copyfileobj(f_in, f_out)
            os.remove(filepath)
            filepath = compressed_file
        
        # Calculate size and checksum
        file_size = os.path.getsize(filepath)
        checksum = calculate_checksum(filepath)
        
        # Update metrics
        duration = time.time() - start_time
        backup_duration_seconds.labels(backup_type='mysql').observe(duration)
        backup_size_bytes.labels(backup_type='mysql').set(file_size)
        last_backup_timestamp.labels(backup_type='mysql').set(time.time())
        backups_total.labels(backup_type='mysql', status='success').inc()
        
        # Save metadata
        save_backup_metadata('mysql', filepath, file_size, checksum)
        
        print(f"✅ [BACKUP] MySQL backup completed: {filepath} ({file_size} bytes, {duration:.2f}s)")
        
        # Upload to cloud if enabled
        if BackupConfig.USE_S3:
            upload_to_s3(filepath, 'mysql')
        if BackupConfig.USE_GOOGLE_CLOUD:
            upload_to_gcs(filepath, 'mysql')
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ [BACKUP] MySQL backup failed: {e.stderr.decode()}")
        backups_total.labels(backup_type='mysql', status='failure').inc()
        return False
    except Exception as e:
        print(f"❌ [BACKUP] MySQL backup error: {e}")
        backups_total.labels(backup_type='mysql', status='failure').inc()
        return False


def backup_files():
    """Backup uploaded files"""
    start_time = time.time()
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'files_backup_{timestamp}.tar.gz'
    filepath = os.path.join(BackupConfig.FILES_BACKUP_DIR, filename)
    
    try:
        print(f"[BACKUP] Starting files backup...")
        
        # Create tar.gz archive
        with tarfile.open(filepath, 'w:gz') as tar:
            tar.add('uploads', arcname='uploads')
        
        # Calculate size and checksum
        file_size = os.path.getsize(filepath)
        checksum = calculate_checksum(filepath)
        
        # Update metrics
        duration = time.time() - start_time
        backup_duration_seconds.labels(backup_type='files').observe(duration)
        backup_size_bytes.labels(backup_type='files').set(file_size)
        last_backup_timestamp.labels(backup_type='files').set(time.time())
        backups_total.labels(backup_type='files', status='success').inc()
        
        # Save metadata
        save_backup_metadata('files', filepath, file_size, checksum)
        
        print(f"✅ [BACKUP] Files backup completed: {filepath} ({file_size} bytes, {duration:.2f}s)")
        
        # Upload to cloud
        if BackupConfig.USE_S3:
            upload_to_s3(filepath, 'files')
        if BackupConfig.USE_GOOGLE_CLOUD:
            upload_to_gcs(filepath, 'files')
        
        return True
        
    except Exception as e:
        print(f"❌ [BACKUP] Files backup error: {e}")
        backups_total.labels(backup_type='files', status='failure').inc()
        return False


def backup_redis():
    """Backup Redis data"""
    start_time = time.time()
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'redis_backup_{timestamp}.rdb'
    filepath = os.path.join(BackupConfig.REDIS_BACKUP_DIR, filename)
    
    try:
        print(f"[BACKUP] Starting Redis backup...")
        
        # Trigger Redis BGSAVE
        import redis
        r = redis.Redis(host=BackupConfig.REDIS_HOST, port=BackupConfig.REDIS_PORT)
        r.bgsave()
        
        # Wait for BGSAVE to complete
        while r.lastsave() < int(time.time()):
            time.sleep(0.5)
        
        # Copy dump.rdb to backup location
        redis_dump = '/var/lib/redis/dump.rdb'  # Adjust path as needed
        if os.path.exists(redis_dump):
            shutil.copy2(redis_dump, filepath)
            
            # Compress
            if BackupConfig.ENABLE_COMPRESSION:
                compressed_file = f'{filepath}.gz'
                with open(filepath, 'rb') as f_in:
                    with gzip.open(compressed_file, 'wb') as f_out:
                        shutil.copyfileobj(f_in, f_out)
                os.remove(filepath)
                filepath = compressed_file
            
            # Calculate size and checksum
            file_size = os.path.getsize(filepath)
            checksum = calculate_checksum(filepath)
            
            # Update metrics
            duration = time.time() - start_time
            backup_duration_seconds.labels(backup_type='redis').observe(duration)
            backup_size_bytes.labels(backup_type='redis').set(file_size)
            last_backup_timestamp.labels(backup_type='redis').set(time.time())
            backups_total.labels(backup_type='redis', status='success').inc()
            
            # Save metadata
            save_backup_metadata('redis', filepath, file_size, checksum)
            
            print(f"✅ [BACKUP] Redis backup completed: {filepath} ({file_size} bytes, {duration:.2f}s)")
            return True
        else:
            print(f"⚠️  [BACKUP] Redis dump.rdb not found")
            return False
            
    except Exception as e:
        print(f"❌ [BACKUP] Redis backup error: {e}")
        backups_total.labels(backup_type='redis', status='failure').inc()
        return False


def full_backup():
    """Perform full backup of everything"""
    print("\n" + "="*60)
    print("🔄 STARTING FULL BACKUP")
    print("="*60)
    
    results = {
        'mysql': backup_mysql(),
        'files': backup_files(),
        'redis': backup_redis()
    }
    
    # Cleanup old backups
    cleanup_old_backups()
    
    # Update age metrics
    update_backup_age_metrics()
    
    print("\n" + "="*60)
    print("📊 BACKUP SUMMARY")
    print("="*60)
    for backup_type, success in results.items():
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"{backup_type.upper()}: {status}")
    print("="*60 + "\n")
    
    return all(results.values())


# ==================== UTILITY FUNCTIONS ====================

def calculate_checksum(filepath):
    """Calculate SHA256 checksum of file"""
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def save_backup_metadata(backup_type, filepath, file_size, checksum):
    """Save backup metadata to JSON file"""
    metadata = {
        'type': backup_type,
        'timestamp': datetime.now().isoformat(),
        'filepath': filepath,
        'filename': os.path.basename(filepath),
        'size_bytes': file_size,
        'size_human': humanize_bytes(file_size),
        'checksum': checksum,
        'compressed': BackupConfig.ENABLE_COMPRESSION
    }
    
    metadata_file = f'{filepath}.metadata.json'
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)


def humanize_bytes(size):
    """Convert bytes to human readable format"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size < 1024.0:
            return f"{size:.2f} {unit}"
        size /= 1024.0
    return f"{size:.2f} PB"


def cleanup_old_backups():
    """Remove backups older than retention period"""
    print("[CLEANUP] Cleaning old backups...")
    
    now = datetime.now()
    
    for backup_type, directory in [
        ('mysql', BackupConfig.MYSQL_BACKUP_DIR),
        ('files', BackupConfig.FILES_BACKUP_DIR),
        ('redis', BackupConfig.REDIS_BACKUP_DIR)
    ]:
        if not os.path.exists(directory):
            continue
        
        for filename in os.listdir(directory):
            filepath = os.path.join(directory, filename)
            
            # Skip metadata files
            if filename.endswith('.metadata.json'):
                continue
            
            # Get file age
            file_time = datetime.fromtimestamp(os.path.getctime(filepath))
            age_days = (now - file_time).days
            
            # Check retention policy
            should_delete = False
            if age_days > BackupConfig.RETENTION_MONTHLY:
                should_delete = True
            elif age_days > BackupConfig.RETENTION_WEEKLY and not is_monthly_backup(file_time):
                should_delete = True
            elif age_days > BackupConfig.RETENTION_DAILY and not is_weekly_backup(file_time):
                should_delete = True
            
            if should_delete:
                os.remove(filepath)
                # Remove metadata too
                metadata_file = f'{filepath}.metadata.json'
                if os.path.exists(metadata_file):
                    os.remove(metadata_file)
                print(f"  🗑️  Removed old backup: {filename} (age: {age_days} days)")


def is_weekly_backup(file_time):
    """Check if backup is from a Sunday (weekly)"""
    return file_time.weekday() == 6  # Sunday


def is_monthly_backup(file_time):
    """Check if backup is from first day of month"""
    return file_time.day == 1


def update_backup_age_metrics():
    """Update metrics showing age of last backup"""
    now = time.time()
    
    for backup_type in ['mysql', 'files', 'redis']:
        last_time = last_backup_timestamp.labels(backup_type=backup_type)._value.get()
        if last_time > 0:
            age_hours = (now - last_time) / 3600
            backup_age_hours.labels(backup_type=backup_type).set(age_hours)


# ==================== CLOUD UPLOAD ====================

def upload_to_s3(filepath, backup_type):
    """Upload backup to AWS S3"""
    try:
        import boto3
        
        s3_client = boto3.client('s3', region_name=BackupConfig.S3_REGION)
        s3_key = f'backups/{backup_type}/{os.path.basename(filepath)}'
        
        s3_client.upload_file(filepath, BackupConfig.S3_BUCKET, s3_key)
        print(f"☁️  [S3] Uploaded to s3://{BackupConfig.S3_BUCKET}/{s3_key}")
        
    except Exception as e:
        print(f"❌ [S3] Upload failed: {e}")


def upload_to_gcs(filepath, backup_type):
    """Upload backup to Google Cloud Storage"""
    try:
        from google.cloud import storage
        
        storage_client = storage.Client()
        bucket = storage_client.bucket(BackupConfig.GCS_BUCKET)
        blob_name = f'backups/{backup_type}/{os.path.basename(filepath)}'
        blob = bucket.blob(blob_name)
        
        blob.upload_from_filename(filepath)
        print(f"☁️  [GCS] Uploaded to gs://{BackupConfig.GCS_BUCKET}/{blob_name}")
        
    except Exception as e:
        print(f"❌ [GCS] Upload failed: {e}")


# ==================== SCHEDULING ====================

def schedule_backups():
    """Schedule automated backups"""
    # Full backup daily at 2 AM
    schedule.every().day.at("02:00").do(full_backup)
    
    # MySQL backup every 6 hours
    schedule.every(6).hours.do(backup_mysql)
    
    # Files backup daily at 3 AM
    schedule.every().day.at("03:00").do(backup_files)
    
    # Redis backup every 2 hours
    schedule.every(2).hours.do(backup_redis)
    
    print("✅ [SCHEDULER] Backup schedule configured")
    print("   • Full backup: Daily at 2:00 AM")
    print("   • MySQL: Every 6 hours")
    print("   • Files: Daily at 3:00 AM")
    print("   • Redis: Every 2 hours")


def run_backup_scheduler():
    """Run the backup scheduler (blocking)"""
    create_directories()
    schedule_backups()
    
    # Do initial backup
    print("\n🚀 [SCHEDULER] Performing initial backup...")
    full_backup()
    
    print("\n⏰ [SCHEDULER] Waiting for scheduled backups...")
    while True:
        schedule.run_pending()
        time.sleep(60)


# ==================== CLI ====================

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'full':
            full_backup()
        elif command == 'mysql':
            backup_mysql()
        elif command == 'files':
            backup_files()
        elif command == 'redis':
            backup_redis()
        elif command == 'schedule':
            run_backup_scheduler()
        elif command == 'cleanup':
            cleanup_old_backups()
        else:
            print("Usage: python backup_manager.py [full|mysql|files|redis|schedule|cleanup]")
    else:
        print("Usage: python backup_manager.py [full|mysql|files|redis|schedule|cleanup]")