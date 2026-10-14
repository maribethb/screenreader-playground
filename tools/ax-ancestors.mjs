// Prints the ancestors of an element in Chrome's accessibility tree, with
// ignored nodes marked, so you can see which containers Chrome exposes.
//
//   node tools/ax-ancestors.mjs <url> <accessible name> [<url> <name> ...]
//
// It starts its own headless Chrome with a throwaway profile, so your normal
// Chrome isn't touched. Set CHROME to the binary if it isn't in the usual
// macOS place. This is Blink's tree from the DevTools protocol, not the macOS
// tree VoiceOver reads, so use Accessibility Inspector to check that.
import {spawn} from 'node:child_process';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const args = process.argv.slice(2);
if (args.length < 2 || args.length % 2) {
  console.error('Usage: node tools/ax-ancestors.mjs <url> <accessible name> [<url> <name> ...]');
  process.exit(1);
}

const binary = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9333;
const profile = mkdtempSync(join(tmpdir(), 'ax-ancestors-'));
const chrome = spawn(binary, [
  '--headless=new', `--remote-debugging-port=${port}`, '--no-first-run',
  `--user-data-dir=${profile}`, 'about:blank',
], {stdio: 'ignore'});

async function http(path, method = 'GET') {
  for (let i = 0; i < 50; i++) {
    try {
      return await (await fetch(`http://127.0.0.1:${port}${path}`, {method})).json();
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  throw new Error(`Chrome didn't start (${binary})`);
}

async function ancestors(url, name) {
  const target = await http(`/json/new?${encodeURIComponent(url)}`, 'PUT');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    pending.get(msg.id)?.(msg);
    pending.delete(msg.id);
  });
  const send = (method, params = {}) => new Promise((r) => {
    pending.set(++id, r);
    ws.send(JSON.stringify({id, method, params}));
  });

  // Give the page's scripts time to run, since repros render their variant
  // from a module script.
  await new Promise((r) => setTimeout(r, 1500));
  await send('Accessibility.enable');
  const {result} = await send('Accessibility.getFullAXTree');
  ws.close();

  const nodes = new Map(result.nodes.map((n) => [n.nodeId, n]));
  const element = result.nodes.find((n) => n.name?.value === name);
  console.log(`\n${url}`);
  if (!element) {
    console.log(`  Nothing named "${name}".`);
    return;
  }
  const chain = [];
  for (let n = element; n; n = nodes.get(n.parentId)) chain.unshift(n);
  for (const [depth, n] of chain.entries()) {
    const label = n.name?.value && n !== chain[0] ? ` "${n.name.value}"` : '';
    const reasons = (n.ignoredReasons ?? []).map((r) => r.name).join(', ');
    console.log(`  ${'  '.repeat(depth)}${n.role?.value ?? '?'}${label}${n.ignored ? `  (ignored: ${reasons})` : ''}`);
  }
}

try {
  for (let i = 0; i < args.length; i += 2) await ancestors(args[i], args[i + 1]);
} finally {
  const exited = new Promise((r) => chrome.once('exit', r));
  chrome.kill();
  await exited;
  rmSync(profile, {recursive: true, force: true, maxRetries: 5});
}
