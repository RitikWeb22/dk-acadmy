/**
 * DK ACADEMY JEE — PM2 Production Cluster Configuration
 * Designed for multi-core Hostinger VPS, AWS EC2, or Dockerized environments.
 * 
 * MongoDB Atlas Connection Pool Architecture:
 * Total Active Connections = (PM2_WORKERS * DB_MAX_POOL_SIZE) + APP_OVERHEAD
 * 
 * Deployment Profiles:
 * 1. Single Worker (M0 Free Tier - 500 conn limit):
 *    instances: 1, DB_MAX_POOL_SIZE: 25, DB_MIN_POOL_SIZE: 5 (Total ~25 conns)
 * 2. 4 Workers (M10 Cluster - 1,500 conn limit):
 *    instances: 4, DB_MAX_POOL_SIZE: 50, DB_MIN_POOL_SIZE: 10 (Total ~200 conns)
 * 3. 8 Workers (M20 High-Concurrency Examination Cluster - 3,000 conn limit):
 *    instances: 8, DB_MAX_POOL_SIZE: 75, DB_MIN_POOL_SIZE: 15 (Total ~600 conns)
 */

module.exports = {
  apps: [
    {
      name: 'dk-academy-api',
      script: './backend/dist/server.js',
      instances: process.env.PM2_INSTANCES ? Number(process.env.PM2_INSTANCES) : (process.env.REDIS_URL ? 4 : 1), // 1 worker default without Redis (avoids socket/state drift); 4+ when REDIS_URL is provided
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1024M',
      listen_timeout: 10000,
      kill_timeout: 8000, // Allow ongoing exam submissions to complete before SIGKILL
      wait_ready: false,
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        DB_MAX_POOL_SIZE: 75,
        DB_MIN_POOL_SIZE: 15,
        DB_WAIT_QUEUE_TIMEOUT_MS: 15000
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5000,
        DB_MAX_POOL_SIZE: 50,
        DB_MIN_POOL_SIZE: 10,
        DB_WAIT_QUEUE_TIMEOUT_MS: 15000
      }
    }
  ]
};

