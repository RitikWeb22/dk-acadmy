#!/usr/bin/env node
/**
 * DK Academy Local Pre-Commit Secret Scanner
 * Blocks commits containing MongoDB credentials, private API keys, or raw secrets.
 */
const { execSync } = require('child_process');

try {
  // Get staged files diff
  const diff = execSync('git diff --cached --name-only', { encoding: 'utf8' });
  const stagedFiles = diff.split('\n').filter(Boolean);

  if (stagedFiles.length === 0) {
    process.exit(0);
  }

  // Check for staged .env files
  const forbiddenFiles = stagedFiles.filter((f) => {
    const base = f.split('/').pop().split('\\').pop();
    return base.startsWith('.env') && base !== '.env.example';
  });

  if (forbiddenFiles.length > 0) {
    console.error('\x1b[31m[SECURITY PRE-COMMIT REJECTED]\x1b[0m Attempting to commit environment files:');
    forbiddenFiles.forEach((f) => console.error(`  - ${f}`));
    console.error('Environment files containing live secrets must never be committed to Git.');
    process.exit(1);
  }

  // Check staged diff content for secret patterns
  const stagedDiff = execSync('git diff --cached', { encoding: 'utf8' });

  const leakPatterns = [
    { pattern: /mongodb(\+srv)?:\/\/[a-zA-Z0-9_.-]+:[a-zA-Z0-9_.-]+@/i, desc: 'MongoDB URI with Credentials' },
    { pattern: /rzp_live_[a-zA-Z0-9]{14,}/, desc: 'Razorpay Live Key ID' },
    { pattern: /(RAZORPAY_KEY_SECRET|CLOUDINARY_API_SECRET|LIVEKIT_API_SECRET)\s*=\s*['"][a-zA-Z0-9_.-]{10,}['"]/, desc: 'Committed API Secret' }
  ];

  for (const { pattern, desc } of leakPatterns) {
    if (pattern.test(stagedDiff)) {
      console.error(`\x1b[31m[SECURITY PRE-COMMIT REJECTED]\x1b[0m High-risk secret detected in diff: ${desc}`);
      console.error('Please move this secret to your local .env file and reference process.env.<VAR>');
      process.exit(1);
    }
  }

  process.exit(0);
} catch (err) {
  // If git command fails, do not block unless error is from explicit exit(1)
  if (err.status === 1) {
    process.exit(1);
  }
  process.exit(0);
}

