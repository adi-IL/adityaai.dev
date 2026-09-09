import { readFileSync, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const verifyDir = process.env.ADITYAAI_VERIFY_DIR || '';
if (!verifyDir) {
  console.log('ADITYAAI_VERIFY_DIR unset; nothing to stop. artifacts left alone.');
  process.exit(0);
}
const pidFile = join(verifyDir, 'server.pid');
if (existsSync(pidFile)) {
  const pid = Number(String(readFileSync(pidFile, 'utf8')).trim());
  if (Number.isInteger(pid) && pid > 0) {
    try {
      process.kill(pid);
      console.log(`stopped pid ${pid}`);
    } catch {
      console.log(`pid file stale or process gone (${pid})`);
    }
  }
  unlinkSync(pidFile);
} else {
  console.log(`no server.pid under ${verifyDir}`);
}
console.log(`artifacts kept under ${verifyDir}/artifacts (if any)`);
