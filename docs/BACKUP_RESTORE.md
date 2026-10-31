# DK Academy — Disaster Recovery & Backup/Restore Playbook

## 1. Objectives & SLA Targets

| Metric | Target | Description |
|---|---|---|
| **Recovery Point Objective (RPO)** | **< 15 minutes** | Maximum allowable data loss in the event of major hardware or cluster corruption. |
| **Recovery Time Objective (RTO)** | **< 60 minutes** | Maximum allowable total downtime to spin up a verified operational database and restore full services. |

---

## 2. MongoDB Atlas Continuous Cloud Backups

### 2.1 Configuration & Snapshot Windows
- **Tier**: MongoDB Atlas Cloud Backup with Continuous Cloud Backups (Oplog replay).
- **Snapshot Frequency**:
  - Incremental snapshots every 6 hours.
  - Continuous point-in-time recovery (PITR) window: **7 days** of minute-by-minute oplog history.
  - Daily snapshots retained for **30 days**.
  - Weekly snapshots retained for **12 months** (compliance/audit).

### 2.2 Point-in-Time Restore (Web Console)
1. Log in to [MongoDB Atlas Console](https://cloud.mongodb.com).
2. Select your project and navigate to **Database Deployments**.
3. Locate the primary production cluster (e.g., `Cluster0`) and click **Backup** in the top navigation.
4. Select **Restore** > **Point in Time Restore**.
5. Choose the exact date and timestamp (UTC/IST) before the incident occurred.
6. **Target Cluster**:
   - Choose **Restore to a New Cluster** (e.g., `dk-recovery-test`) to perform non-destructive verification without impacting live traffic.
   - Or choose **Restore to Current Cluster** if primary disaster recovery has been formally authorized.
7. Click **Confirm Restore**. Atlas will provision the cluster, replay the oplog up to the designated second, and notify via email/Slack when ready.

---

## 3. On-Premises & Drill Restore Procedure (CLI)

Never expose raw connection strings containing passwords on the terminal CLI or in command-line arguments. Always use environment variables.

### 3.1 Creating a Logical Backup (`mongodump`)
Set your connection URI in a temporary environment variable:

```bash
# Linux / macOS
export ATLAS_RESTORE_URI="mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/dk_institute?retryWrites=true&w=majority"
mongodump --uri="$ATLAS_RESTORE_URI" --gzip --archive="./backups/dk_backup_$(date +%Y%m%d_%H%M%S).archive.gz"
unset ATLAS_RESTORE_URI

# Windows PowerShell
$env:ATLAS_RESTORE_URI="mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/dk_institute?retryWrites=true&w=majority"
$backupName = "backups\dk_backup_" + (Get-Date -Format "yyyyMMdd_HHmmss") + ".archive.gz"
mongodump --uri="$env:ATLAS_RESTORE_URI" --gzip --archive="$backupName"
Remove-Item Env:\ATLAS_RESTORE_URI
```

### 3.2 Performing a Drill Restore to Staging/Local (`mongorestore`)
To verify backup integrity quarterly, execute a drill restore onto a local or staging database instance:

```bash
# 1. Point to the target test database (isolated test instance)
# Linux / macOS
export TARGET_TEST_URI="mongodb://127.0.0.1:27017/dk_institute_drill_test"
mongorestore --uri="$TARGET_TEST_URI" --gzip --archive="./backups/latest_backup.archive.gz" --drop
unset TARGET_TEST_URI

# Windows PowerShell
$env:TARGET_TEST_URI="mongodb://127.0.0.1:27017/dk_institute_drill_test"
mongorestore --uri="$env:TARGET_TEST_URI" --gzip --archive="backups\latest_backup.archive.gz" --drop
Remove-Item Env:\TARGET_TEST_URI
```

### 3.3 Post-Restore Verification Checklist
1. **Document Counts**:
   Verify counts match expected production numbers:
   ```javascript
   db.users.countDocuments();
   db.orders.countDocuments();
   db.courses.countDocuments();
   db.webhookevents.countDocuments();
   ```
2. **Index Rebuilding**:
   Ensure compound indexes exist:
   ```javascript
   db.users.getIndexes();
   db.orders.getIndexes();
   ```
3. **Application Verification**:
   Point backend test configuration to the restored database:
   ```bash
   MONGO_URI="mongodb://127.0.0.1:27017/dk_institute_drill_test" npm --prefix backend test
   ```
4. **Log Incident / Drill Completion**:
   Record drill execution date, time taken (RTO achieved), operator name, and verification results in the internal audit log.

