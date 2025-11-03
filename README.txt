CA360 CHAT BACKUP
=================
Backup Date: 2025-10-25 02:11:23
Source: C:\CA360_CHAT

TO RESTORE:
1. Copy all files back to C:\CA360_CHAT
2. Run: docker-compose down
3. Run: docker exec -i kaa_mysql mysql -u root -p123 kaa_ho < database_backup.sql
4. Run: docker-compose up -d --build
