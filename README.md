# Screenreader playground

Minimal reproductions of the screenreader problems we ran into while making Blockly accessible, one page per issue. See [docs/design.md](docs/design.md) for why it's built the way it is.

```sh
npm install
npm run dev        # build, watch and serve on a free port, preferring 8000; set PORT to pick one
npm run build      # one-off build into dist/
npm run typecheck
```

## Adding a repro

1. Add an entry to `repros.json`, with an `environments` object for the screenreaders and browsers you know about. Anything you leave out shows as unknown. See [The manifest](docs/design.md#the-manifest).
2. Create `src/repros/<slug>/index.html`, copying an existing repro. It needs `<!-- build:environments -->`, `<!-- build:code -->` (which adds its own "Code" heading), `<div id="repro"><!-- build:repro --></div>` and `<!-- build:templates -->`. With more than one variant, it also needs an `<h2 id="variants">`, then a `<ul class="variant-tabs">` of `?variant=<id>#variants` links, and a `<div class="variant-panel">` holding a `<div data-variant-description="<id>" hidden>` for each variant, followed by `<!-- build:code -->`. Each of those holds a paragraph describing the variant. If the actual output is too much to follow as one section, give each one an `<h3>Actual output</h3>` with what happens with that variant, and keep a short summary under the page's "Actual output" heading.
3. Add `variants/<id>.html` for each variant, plus `variants/<id>.ts` exporting `setup(container)` if the variant has behavior.
4. If there's more than one variant, or any behavior, add a `main.ts` that calls `initRepro` and a `<script type="module" src="main.js">` to the page.
5. Restart `npm run dev` so esbuild picks up the new entry point.

Keep the repro generic. The code, steps and expected output should use plain web concepts like "move element" or "add item", not Blockly ones like "move block" or "workspace", so a reader who's never used Blockly can follow it. Blockly can still come up in the prose around the repro, like the "Actual output" and notes sections, where we describe what we saw there. See [Generic examples](docs/design.md#generic-examples-not-blockly-ones) in the design doc.

## Checking Chrome's accessibility tree

`tools/ax-ancestors.mjs` prints an element's ancestors in Chrome's accessibility tree, marking the ones Chrome ignores. It starts its own headless Chrome, so run it with the dev server up:

```sh
node tools/ax-ancestors.mjs "http://localhost:8000/repros/live-region-during-focus-change/?variant=group" "Add item"
```

Pass more URL and name pairs to compare pages. This is Blink's tree, not the macOS one VoiceOver reads, so check anything important with Accessibility Inspector too.
