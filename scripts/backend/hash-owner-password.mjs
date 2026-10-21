import { randomBytes, scryptSync } from 'node:crypto';
import { emitKeypressEvents } from 'node:readline';

if (!process.stdin.isTTY) {
  console.error('Run interactively in a terminal; do not pass the password as an argument.');
  process.exit(1);
}
process.stdout.write('New owner password (at least 12 characters, hidden): ');
emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.resume();
let password = '';
process.stdin.on('keypress', (value, key) => {
  if (key?.ctrl && key.name === 'c') { process.stdin.setRawMode(false); process.exit(130); }
  if (key?.name === 'return') {
    process.stdin.setRawMode(false);
    process.stdin.pause();
    process.stdout.write('\n');
    if (password.length < 12 || password.length > 1024) {
      console.error('Password must contain 12–1024 characters.'); process.exit(1);
    }
    const salt = randomBytes(16);
    const digest = scryptSync(password, salt, 64);
    password = '';
    console.log(`OWNER_PASSWORD_HASH='scrypt:${salt.toString('hex')}:${digest.toString('hex')}'`);
    process.exit(0);
  }
  if (key?.name === 'backspace') { password = Array.from(password).slice(0, -1).join(''); return; }
  if (value && !key?.ctrl && !key?.meta && !/[\x00-\x1f\x7f]/.test(value)) password += value;
});
