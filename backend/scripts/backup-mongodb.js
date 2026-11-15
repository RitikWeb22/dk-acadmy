import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;
const BACKUP_DIR = path.resolve(process.cwd(), 'storage', 'backups');
const RETENTION_DAYS = Number(process.env.BACKUP_RETENTION_DAYS) || 7;

if (!MONGO_URI) {
  console.error('[Backup Error] MONGO_URI is missing in environment variables.');
  process.exit(1);
}

// Ensure backup storage directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Rotates existing backups older than retention window.
 */
function rotateOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const maxAgeMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;

    let prunedCount = 0;
    files.forEach((file) => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > maxAgeMs) {
        if (stats.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
        prunedCount++;
      }
    });

    if (prunedCount > 0) {
      console.log(`[Backup Rotation] Pruned ${prunedCount} archive(s) older than ${RETENTION_DAYS} days.`);
    }
  } catch (err) {
    console.warn('[Backup Rotation Warning] Could not rotate old backups:', err.message);
  }
}

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const targetDir = path.join(BACKUP_DIR, `backup-${timestamp}`);
  fs.mkdirSync(targetDir, { recursive: true });

  console.log(`[MongoDB Backup] Starting automated backup at ${new Date().toISOString()}...`);
  console.log(`[MongoDB Backup] Target directory: ${targetDir}`);

  const startTime = Date.now();

  try {
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      family: 4
    });

    const db = conn.connection.db;
    if (!db) {
      throw new Error('Database handle unavailable.');
    }

    const collections = await db.listCollections().toArray();
    console.log(`[MongoDB Backup] Discovered ${collections.length} collections.`);

    const manifest = {
      timestamp: new Date().toISOString(),
      collections: {} as Record<string, number>,
      totalDocuments: 0,
      durationMs: 0
    };

    for (const colInfo of collections) {
      const colName = colInfo.name;
      if (colName.startsWith('system.')) continue;

      const col = db.collection(colName);
      const docs = await col.find({}).toArray();

      const filePath = path.join(targetDir, `${colName}.json.gz`);
      const jsonBuffer = Buffer.from(JSON.stringify(docs, null, 2), 'utf-8');
      const compressed = zlib.gzipSync(jsonBuffer);

      fs.writeFileSync(filePath, compressed);

      manifest.collections[colName] = docs.length;
      manifest.totalDocuments += docs.length;
      console.log(`  ✓ ${colName}: ${docs.length} documents archived (${(compressed.length / 1024).toFixed(1)} KB compressed)`);
    }

    manifest.durationMs = Date.now() - startTime;
    fs.writeFileSync(path.join(targetDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    console.log(`[MongoDB Backup] Successfully backed up ${manifest.totalDocuments} documents across ${Object.keys(manifest.collections).length} collections in ${manifest.durationMs}ms.`);

    rotateOldBackups();
  } catch (error) {
    console.error('[MongoDB Backup Failed]:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('[MongoDB Backup] Database connection closed.');
  }
}

runBackup();
