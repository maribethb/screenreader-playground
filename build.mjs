// Builds the site into dist/.
//
//   node build.mjs            one-off build
//   node build.mjs --watch    rebuild on change and serve dist/
//
// The dev server uses $PORT if it's set. Otherwise esbuild picks a free port,
// preferring 8000-8009, so several checkouts can serve at once.
//
// esbuild bundles each repro's main.ts. Everything else is string replacement
// on the HTML: each repro's index.html has placeholder comments that get
// replaced with the variant markup and the code blocks shown on the page.

import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'src';
const OUT = 'dist';
const REPROS = path.join(SRC, 'repros');
// The index's headings, in order. Screenreader quirks are split further by
// each entry's `screenreader`, and entries without one go above the split.
const CATEGORIES = [
  'Live region issues',
  'Region announcements',
  'Spec issues',
  'Screenreader quirks',
  'Focus problems',
];
const QUIRKS = 'Screenreader quirks';
const QUIRK_SCREENREADERS = ['VoiceOver', 'JAWS', 'NVDA', 'ChromeVox', 'Narrator'];

// The environments table on each repro page. Combinations that can't exist
// (ChromeVox only runs in Chrome, JAWS and NVDA only on Windows) are N/A, and
// anything repros.json doesn't mention is unknown.
const SCREENREADERS = ['VoiceOver', 'JAWS', 'NVDA', 'ChromeVox'];
const BROWSERS = ['Chrome', 'Safari', 'Firefox'];
const NOT_APPLICABLE = {ChromeVox: ['Safari', 'Firefox'], JAWS: ['Safari'], NVDA: ['Safari']};
const RESULTS = {
  'affected': '<td class="affected">Yes</td>',
  'not affected': '<td class="not-affected">No</td>',
  'unknown': '<td>Unknown</td>',
};

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Replaces `<!-- build:name -->`, failing loudly if it's missing. */
function fill(html, name, replacement, file) {
  const placeholder = `<!-- build:${name} -->`;
  if (!html.includes(placeholder)) {
    throw new Error(`${file} is missing ${placeholder}`);
  }
  // A function, so `$&` and friends in the replacement aren't special.
  return html.replace(placeholder, () => replacement);
}

function reproSlugs() {
  return fs.existsSync(REPROS) ? fs.readdirSync(REPROS).sort() : [];
}

function readManifest() {
  const manifest = JSON.parse(fs.readFileSync('repros.json', 'utf8'));
  const slugs = new Set(manifest.map((entry) => entry.slug));
  for (const entry of manifest) {
    if (!CATEGORIES.includes(entry.category)) {
      throw new Error(`repros.json: ${entry.slug} has unknown category "${entry.category}"`);
    }
    if (entry.screenreader !== undefined) {
      if (entry.category !== QUIRKS) {
        throw new Error(`repros.json: ${entry.slug} has a screenreader but isn't in "${QUIRKS}"`);
      }
      if (!QUIRK_SCREENREADERS.includes(entry.screenreader)) {
        throw new Error(`repros.json: ${entry.slug} has unknown screenreader "${entry.screenreader}"`);
      }
    }
    for (const [screenreader, browsers] of Object.entries(entry.environments ?? {})) {
      if (!SCREENREADERS.includes(screenreader)) {
        throw new Error(`repros.json: ${entry.slug} has unknown screenreader "${screenreader}"`);
      }
      for (const [browser, result] of Object.entries(browsers)) {
        if (!BROWSERS.includes(browser)) {
          throw new Error(`repros.json: ${entry.slug} has unknown browser "${browser}"`);
        }
        if (NOT_APPLICABLE[screenreader]?.includes(browser)) {
          throw new Error(`repros.json: ${entry.slug} gives a result for ${screenreader} with ${browser}, which is N/A`);
        }
        if (!Object.hasOwn(RESULTS, result)) {
          throw new Error(`repros.json: ${entry.slug} has unknown result "${result}" for ${screenreader} with ${browser}`);
        }
      }
    }
  }
  for (const slug of reproSlugs()) {
    if (!slugs.has(slug)) throw new Error(`${REPROS}/${slug} has no entry in repros.json`);
  }
  return manifest;
}

function readVariants(slug) {
  const dir = path.join(REPROS, slug, 'variants');
  const ids = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.html'))
    .map((file) => path.basename(file, '.html'))
    .sort();
  if (ids.length === 0) throw new Error(`${dir} has no variants`);
  return ids.map((id) => {
    const tsFile = path.join(dir, `${id}.ts`);
    return {
      id,
      html: fs.readFileSync(path.join(dir, `${id}.html`), 'utf8'),
      ts: fs.existsSync(tsFile) ? fs.readFileSync(tsFile, 'utf8') : null,
    };
  });
}

function codeBlock(heading, source) {
  return `<h3>${heading}</h3>\n<pre><code>${escapeHtml(source.trimEnd())}</code></pre>`;
}

function environmentsTable(environments = {}) {
  const header = BROWSERS.map((browser) => `<th scope="col">${browser}</th>`).join('');
  const rows = SCREENREADERS.map((screenreader) => {
    const cells = BROWSERS.map((browser) => {
      if (NOT_APPLICABLE[screenreader]?.includes(browser)) return '<td>N/A</td>';
      return RESULTS[environments[screenreader]?.[browser] ?? 'unknown'];
    });
    return `<tr><th scope="row">${screenreader}</th>${cells.join('')}</tr>`;
  });
  return `<table class="environments">\n<thead>\n<tr><td></td>${header}</tr>\n</thead>\n<tbody>\n${rows.join('\n')}\n</tbody>\n</table>`;
}

function buildRepro(entry) {
  const file = path.join(REPROS, entry.slug, 'index.html');
  const variants = readVariants(entry.slug);
  const single = variants.length === 1;
  const needsScript = !single || variants.some((variant) => variant.ts);
  if (needsScript && !fs.existsSync(path.join(REPROS, entry.slug, 'main.ts'))) {
    throw new Error(`${entry.slug} has variants to switch between or set up, but no main.ts`);
  }

  let html = fs.readFileSync(file, 'utf8');
  if (!single) {
    const linked = [...html.matchAll(/href="\?variant=([^"]*)"/g)].map((match) => match[1]).sort();
    const ids = variants.map((variant) => variant.id);
    if (linked.join() !== ids.join()) {
      throw new Error(`${file} links to variants [${linked}] but variants/ has [${ids}]`);
    }
  }

  // The heading names the variant, so after switching, a screenreader user
  // can tell which one they're on without finding the variant list.
  const code = variants.map((variant) => {
    const blocks = [codeBlock('HTML', variant.html)];
    if (variant.ts) blocks.push(codeBlock('TypeScript', variant.ts));
    if (single) return `<h2>Code</h2>\n${blocks.join('\n')}`;
    return `<div data-variant-code="${variant.id}" hidden>\n<h2>Code for the ${variant.id} variant</h2>\n${blocks.join('\n')}\n</div>`;
  });

  // Repros with one variant get their markup inlined, so it's parser-inserted.
  // Otherwise page.ts clones the chosen variant's template into #repro.
  const templates = single
    ? ''
    : variants
        .map((variant) => `<template data-variant="${variant.id}">\n${variant.html}</template>\n`)
        .join('');

  html = fill(html, 'environments', environmentsTable(entry.environments), file);
  html = fill(html, 'code', code.join('\n'), file);
  html = fill(html, 'repro', single ? variants[0].html : '', file);
  html = fill(html, 'templates', templates, file);

  const outDir = path.join(OUT, 'repros', entry.slug);
  fs.mkdirSync(outDir, {recursive: true});
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
}

// Repros with a page are links. The rest are plain text, so the index also
// shows what's still to do.
function indexList(entries) {
  const items = entries.map((entry) => {
    const title = escapeHtml(entry.title);
    if (!fs.existsSync(path.join(REPROS, entry.slug))) return `<li>${title}</li>`;
    return `<li><a href="repros/${entry.slug}/">${title}</a></li>`;
  });
  return `<ul>\n${items.join('\n')}\n</ul>`;
}

function buildIndex(manifest) {
  const sections = [];
  for (const category of CATEGORIES) {
    const entries = manifest.filter((entry) => entry.category === category);
    if (entries.length === 0) continue;
    sections.push(`<h2>${escapeHtml(category)}</h2>`);
    const general = entries.filter((entry) => entry.screenreader === undefined);
    if (general.length > 0) sections.push(indexList(general));
    for (const screenreader of QUIRK_SCREENREADERS) {
      const own = entries.filter((entry) => entry.screenreader === screenreader);
      if (own.length > 0) sections.push(`<h3>${screenreader}</h3>`, indexList(own));
    }
  }

  const file = path.join(SRC, 'index.html');
  const html = fill(fs.readFileSync(file, 'utf8'), 'index', sections.join('\n'), file);
  fs.writeFileSync(path.join(OUT, 'index.html'), html);
}

/** Everything that isn't esbuild's job. */
function buildPages() {
  const manifest = readManifest();
  fs.mkdirSync(OUT, {recursive: true});
  fs.cpSync(path.join(SRC, 'shared', 'page.css'), path.join(OUT, 'shared', 'page.css'));
  for (const entry of manifest) {
    if (fs.existsSync(path.join(REPROS, entry.slug))) buildRepro(entry);
  }
  buildIndex(manifest);
}

const esbuildOptions = {
  entryPoints: reproSlugs()
    .filter((slug) => fs.existsSync(path.join(REPROS, slug, 'main.ts')))
    .map((slug) => ({in: path.join(REPROS, slug, 'main.ts'), out: `repros/${slug}/main`})),
  outdir: OUT,
  bundle: true,
  format: 'esm',
  target: 'es2022',
  // Readable output, so DevTools shows the same code as the repo and the page.
  minify: false,
  sourcemap: true,
  logLevel: 'info',
};

if (process.argv.includes('--watch')) {
  const ctx = await esbuild.context(esbuildOptions);
  // Claim the port before touching dist/, so a dev server that can't get
  // the $PORT it was asked for fails without wiping dist/.
  const {port} = await ctx.serve({
    servedir: OUT,
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
  });
  fs.rmSync(OUT, {recursive: true, force: true});
  buildPages();
  await ctx.watch();
  console.log(`Serving http://localhost:${port}/`);
  console.log('Restart this script after adding a new repro.');

  // esbuild only watches the TypeScript it bundles. The HTML, the CSS and
  // the TypeScript shown in code blocks need rebuilding on any change.
  let timer;
  const rebuildPages = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        buildPages();
        console.log('Rebuilt pages');
      } catch (error) {
        console.error(error.message);
      }
    }, 50);
  };
  fs.watch(SRC, {recursive: true}, rebuildPages);
  fs.watch('repros.json', rebuildPages);
} else {
  fs.rmSync(OUT, {recursive: true, force: true});
  buildPages();
  await esbuild.build(esbuildOptions);
}
