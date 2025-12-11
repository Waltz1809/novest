---
description: Guide for database backup, restore, and seeding operations with PostgreSQL
---

# Database Utilities Workflow

## Prerequisites
- PostgreSQL installed locally
- Database credentials configured in `.env`
- Prisma client installed (`npm install`)

---

## 1. Seed Database (Development)

Run this to populate the database with sample data for testing:

```powershell
// turbo
npx prisma db seed
```

> ⚠️ **Warning**: This will DELETE all existing data before seeding!

---

## 2. Import Backup from Production

### If backup is a `.sql` file:

```powershell
# Option 1: Import directly
psql -U novest_dev -d novest_local -f backup_file.sql

# Option 2: If you need to recreate database first
psql -U postgres -c "DROP DATABASE IF EXISTS novest_local;"
psql -U postgres -c "CREATE DATABASE novest_local OWNER novest_dev;"
psql -U novest_dev -d novest_local -f backup_file.sql
```

### If backup is a `.dump` file (custom format):

```powershell
pg_restore -U novest_dev -d novest_local -v backup_file.dump
```

### After importing:

```powershell
// turbo
npx prisma generate
```

> 📌 **Note**: Do NOT run `npx prisma db push` or `npx prisma db seed` after importing backup - it will overwrite your data!

---

## 3. Export/Backup Local Database

### Export as SQL file:

```powershell
pg_dump -U novest_dev -d novest_local -F p -f backup_local.sql
```

### Export as custom format (smaller, faster restore):

```powershell
pg_dump -U novest_dev -d novest_local -F c -f backup_local.dump
```

---

## 4. Reset Database (Development Only)

Reset to empty schema and re-seed:

```powershell
// turbo
npx prisma migrate reset
```

This will:
1. Drop all tables
2. Re-apply all migrations
3. Run seed script

---

## 5. Sync Schema Changes

After modifying `schema.prisma`:

```powershell
// turbo
npx prisma db push
```

Or create a migration for tracking:

```powershell
npx prisma migrate dev --name your_migration_name
```

---

## 6. Open Prisma Studio

Visual database browser:

```powershell
// turbo
npx prisma studio
```
