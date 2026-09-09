const base = (process.env.ADITYAAI_BASE_URL || 'https://www.adityaai.dev').replace(/\/$/, '');
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('usage: http-probe.mjs <path> [--expect-status N] [--expect-redirect substr] [--grep substr]...');
  process.exit(2);
}
const pathArg = args[0];
let expectStatus = null;
let expectRedirect = null;
const greps = [];
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--expect-status') expectStatus = Number(args[++i]);
  else if (args[i] === '--expect-redirect') expectRedirect = args[++i];
  else if (args[i] === '--grep') greps.push(args[++i]);
  else {
    console.error(`unknown arg ${args[i]}`);
    process.exit(2);
  }
}
const url = `${base}${pathArg}`;

if (expectRedirect) {
  const res = await fetch(url, { redirect: 'manual' });
  const loc = res.headers.get('location') || '';
  console.log(`status=${res.status} location=${loc}`);
  if (![301, 308].includes(res.status)) {
    console.error(`unexpected status ${res.status}`);
    process.exit(1);
  }
  if (!loc.includes(expectRedirect)) {
    console.error(`location missing ${expectRedirect}`);
    process.exit(1);
  }
  process.exit(0);
}

const res = await fetch(url, { redirect: 'follow' });
const body = await res.text();
console.log(`status=${res.status} url=${url}`);
if (expectStatus != null && res.status !== expectStatus) {
  console.error(`expected ${expectStatus}`);
  process.exit(1);
}
for (const g of greps) {
  if (!body.includes(g)) {
    console.error(`body missing: ${g}`);
    process.exit(1);
  }
}
