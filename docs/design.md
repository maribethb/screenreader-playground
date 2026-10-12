# Screenreader playground design doc

Status: draft

## Why does this exist?

We're writing an article about the problems we ran into while making a complex web application (Blockly) fully screenreader-compatible. A lot of those problems are hard to believe from prose alone. "VoiceOver says 'group' a lot" sounds like a nitpick until you've heard it say "group" four times before it gets to the thing you actually focused.

The playground is a static site with one small reproduction per issue. A reader with a screenreader should be able to open a page, follow a few steps, and hear the problem for themselves. Every page also shows the exact markup and script that caused the problem, right there on the page, so a reader without a screenreader can still see what went wrong without digging through Blockly or opening view source.

The site is deliberately boring. There's no storytelling on the repro pages and no fancy UI. The article tells the story, and the playground is the evidence.

## Who are we building for?

- Readers of the article, mostly web developers and accessibility practitioners, who want to verify a claim or see the code behind it.
- Screenreader and browser vendors, if we end up filing bugs. A minimal repro on a public URL is the thing a bug report needs most.
- Us. Several of these issues are half-remembered ("the navigation is weird but I can't remember how"), and building the repro is how we find out what the bug actually was.

## Goals

- Every issue in the article that can be reproduced has its own page.
- Each page shows the broken behavior and, where we had them, each of our attempts at a workaround, so a reader can compare them.
- Each page displays the HTML and TypeScript for the current variant, and that code is short enough to read in one sitting.
- Each repro is self-contained, so that one person (or one agent) can work on a single repro without touching the others.

## Non-goals

- Explaining the issues in depth. That's the article's job.
- Using real Blockly code. Repros are minimal hand-written markup only.
- Automated testing of screenreader output. See the rejected options below.
- Upstream bug links and exact tested versions. We'll want these eventually, but some of these bugs probably don't have an upstream report at all, and that's a separate refinement pass.
- Pinning down every detail of every repro in this doc. Several entries below are mostly "needs investigation", and that's fine. Each one will get its own focused pass later.

## Why one page per repro?

Screenreader bugs are sensitive to state that's hard to see. A live region that was announced on page load, a focus position left over from a previous interaction, the browser's cached accessibility tree - any of these can change what a screenreader says next.

Suppose the live region repros and the region announcement repros lived on the same page. A reader works through the live region queue demo first, which leaves a polite live region in the DOM with a pending message. They then move on to the region announcement demo, focus into the region, and hear the leftover live region message instead of (or on top of) the region label. They now think they've reproduced the region bug, or that they failed to, and either way the repro lied to them.

So every repro gets its own HTML document, and the index page is just a list of links. Navigating to a repro is a full page load, which gives the screenreader a clean slate.

## Variants

Most repros have more than one version to show: the broken one, then whatever we tried to fix it. For example, the live region announcements repro will have a naive version, a debounced version, and a version with our own message queue. We'll call each of these a "variant".

Variants have the same contamination problem as repros, just on a smaller scale. Two live regions on the same page will happily talk over each other, which is one of the bugs we're trying to demonstrate. So only one variant exists in the DOM at a time.

Each repro page has a plain list of links to its variants, using a query parameter: `?variant=naive`, `?variant=debounce`, `?variant=queue`. Clicking one reloads the page. On load, the page's script reads the parameter, clones the matching `<template>` into the repro container, and runs that variant's `setup` function. With no parameter, the page shows the broken variant.

One thing to be aware of is that template cloning means the repro markup is inserted by script rather than by the HTML parser. My intuition is that this doesn't matter for anything on our list, because it all happens before the reader interacts with the page. But some of these bugs are about the rendering lifecycle, so it's not impossible. If we find a bug that only reproduces with parser-inserted markup, that repro's variants get their own HTML files instead. Repros with only one variant have their markup inlined directly into the page and skip the template.

## Showing the code

Every repro page shows the HTML and TypeScript for the current variant, as code blocks on the page. Readers shouldn't have to open view source or go to GitHub to find out what we did.

This matters more than it might seem, because a big part of the argument is how innocent the broken code looks. Take headings inside lists. Suppose you have a list of categories, and each category has a name and some items under it. This is the obvious markup:

```html
<ul>
  <li>
    <h3>Loops</h3>
    <p>Repeat a set of blocks.</p>
  </li>
  <li>
    <h3>Logic</h3>
    <p>Make decisions with if and else.</p>
  </li>
</ul>
```

It validates. Every piece of it is something you'd find in a beginner's HTML tutorial. As far as we know, nothing in the HTML or ARIA specs says you can't do it. And it's broken. A reader who sees those ten lines directly above the repro, and then hears what a screenreader does with them, gets the point of the article in about thirty seconds. A reader who has to go and find the markup in view source, surrounded by page chrome and variant-switching code, mostly doesn't.

So the code we show has to be the minimal reproduction and nothing else. That has a few consequences:

- Each variant is its own pair of files: `variants/<id>.html` for the markup and `variants/<id>.ts` for the behavior. The build script inlines the HTML file into the page twice, once as the `<template>` that actually runs, and once escaped inside a `<pre><code>` block. The TypeScript file is shown as source and also bundled. Because both come from the same file, the code on the page can't drift from the code that runs.
- The variant's TypeScript file contains only the repro logic. It exports a `setup(container)` function, and all the glue (reading the query parameter, cloning the template, wiring up the event log) lives in `src/shared/`, where it never gets shown. If a variant has no behavior, like the headings example above, there's no TypeScript block at all.
- Each code block gets its own heading ("HTML" and "TypeScript") so screenreader users can skip past it. The markup is escaped text, so the `<h3>`s in the code block above are just characters and don't end up in the page's heading list.
- No syntax highlighting, at least to start with. It'd be nice to have, but it's a fancy UI feature and the code blocks are short. If we want it later, it should happen at build time so the page doesn't render anything with script.

For variants that are workarounds, the code block is where the reader sees how much more code it took. The `live-region-announcements` repro going from a one-line `textContent` assignment to a whole message queue makes the case better than any sentence in the article could.

## What a repro page looks like

Every repro page follows the same template:

1. A heading with the issue name, and a link back to the index.
2. Which screenreaders and browsers are affected, as far as we know.
3. Steps to reproduce.
4. Expected output.
5. Actual output.
6. The list of variant links, each with one or two sentences on what that variant changes. The current variant is marked with `aria-current="page"`.
7. The code for the current variant, as described above.
8. The repro itself, in a container introduced by its own heading so it's easy to jump to.
9. Notes, including anything we still don't know.

The code comes before the live repro on purpose. Sighted readers see the innocent-looking markup first and then try it, and screenreader users can jump straight to the repro heading if they'd rather hear it first.

"Expected output" needs a bit of care. For some issues, it's what the ARIA spec says should happen. For others, like the JAWS combobox hints, the spec doesn't say anything and "expected" is really "what would be reasonable". The text should say which one it is.

The page chrome itself has to be accessible - it would be pretty embarrassing otherwise - but it also has to stay out of the way. Several repros are about region and landmark announcements, so the chrome uses headings for structure and avoids landmarks (`<main>`, `<nav>`, `<section>` with a label, and so on). Probably a `<main>` around the description wouldn't hurt anything, but the cost of being wrong is a repro that quietly lies, and we'd rather not find that out the hard way. If it turns out the chrome landmarks don't interfere with anything, we can add them back.

Some repros, like `focusout-on-removal`, are about events rather than speech. Those pages get a plain event log so readers can see what fired. The log is a `<pre>` that is not a live region, for the same reason as above.

## Tech stack

The site is plain TypeScript with no UI framework, built with esbuild and deployed to GitHub Pages.

- Each repro has an `index.html` with the page's description and steps, a `main.ts` that registers its variants, and a `variants/` directory with the HTML and TypeScript for each variant. Repro markup lives in HTML wherever possible, and TypeScript is only for behavior that can't be expressed in markup.
- esbuild builds one bundle per repro, with each `main.ts` as an entry point. Output is not minified and includes source maps, so the code in DevTools looks like the code in the repo and the code on the page.
- A small build script (`build.mjs`) runs esbuild, inlines each variant's HTML (as a `<template>` and as an escaped code block) and TypeScript (as an escaped code block) into its repro page, and generates the index page.
- The index is generated at build time from a manifest (`repros.json`) as static HTML. It doesn't need to be rendered by script, and given what this site is about, it'd be a bit silly if the index itself had rendering lifecycle bugs.
- `esbuild --serve` (via the build script's watch mode) is the dev server.
- A GitHub Actions workflow builds on push to `main` and deploys `dist/` to GitHub Pages. Since it's a project site served from `/screenreader-playground/`, all links are relative.

### Layout

```
screenreader-playground/
  package.json
  tsconfig.json
  build.mjs
  repros.json            # slug, title, category, affected screenreaders, status
  src/
    index.html           # index page template
    shared/
      page.ts            # variant switching, event log
      page.css
    repros/
      live-region-announcements/
        index.html       # description, steps, placeholders for templates and code
        main.ts          # registers each variant's setup function
        variants/
          naive.html
          naive.ts
          debounce.html
          debounce.ts
          queue.html
          queue.ts
      headings-in-lists/
        index.html
        variants/
          broken.html    # no .ts, since there's no behavior
      ...
  docs/
    design.md
  .github/workflows/
    deploy.yml
```

`src/shared/` should stay tiny. It's for the variant switching and the event log, and that's about it. Workarounds like the live region message queue live in their own repro, not in shared code, even if two repros could use them. Each repro should be understandable without opening another file.

### The manifest

`repros.json` is a list of entries like this:

```json
{
  "slug": "live-region-assertive",
  "title": "Assertive live region announcements are ignored",
  "category": "ARIA",
  "affects": ["TBD"],
  "status": "todo"
}
```

`status` is one of `todo`, `draft` (the page exists but we haven't confirmed it reproduces), or `verified` (someone has heard the bug with a real screenreader). The index shows the status next to each link, so we can publish the site before every repro is done without claiming more than we know.

## Repro catalogue

Repros are named by symptom rather than by screenreader, since the same page will often be tested with several screenreaders. The index groups them using the same categories as the article.

None of the entries below are specs. They're a record of what we know right now, and a starting point for whoever (or whatever) picks up each repro.

### ARIA spec issues

#### `live-region-assertive`

At least one user agent refused to read assertive announcements, so we had to use `aria-live="polite"` even though assertive seemed more correct per the spec.

- Variants: `assertive` (broken), `polite` (our workaround).
- It was VoiceOver on macOS, according to micro:bit's testing in [Blockly issue 9460](https://github.com/RaspberryPiFoundation/blockly/issues/9460). The assertive announcement was lost when focus moved at the same time, so the repro moves focus too. The repro page has the rest of the evidence.

#### `live-region-announcements`

Repeated and overlapping live region messages. Saying the same message twice in a row didn't behave well, so we added a debounce. We then ended up writing our own message queue. Even with the queue, there's no way to stop live region announcements from overlapping with the screenreader's own automatic output, like reading the newly focused element.

- Variants: `naive` (broken), `debounce`, `queue`. Possibly more once we look at the workaround history - I'll dig up references to these later.
- Up for debate, but it might be worth splitting the overlap with automatic output into its own repro, since none of the variants fix it and that's kind of the point.

#### `headings-in-lists`

Headings inside list items don't work properly. This probably affects all browsers. Heading navigation behaves strangely, but we don't remember exactly how.

- Variants: `broken` only, unless we find a workaround while investigating.
- Needs investigation: what actually goes wrong. Missing from the headings list, skipped during heading navigation, read with the wrong level, or something else.

#### `lifecycle-timing`

Changing `tabindex` and some `aria-*` properties has to be done at the right point in the rendering lifecycle, or the change doesn't take effect the way you'd expect.

- Variants: probably `wrong-timing` and `right-timing`.
- Needs investigation: we don't know what the wrong and right orderings were. The fix should be findable in the Blockly commit history.

#### Skipped: `role="none"` not removing elements from the accessibility tree

Ben thinks this exists. I think it's user error that only applies when the element is focusable, and an element with both a `tabindex` and `role="none"` is a mistake in the first place. We're not making a repro for it.

### VoiceOver

#### `voiceover-group`

VoiceOver says "group" a lot. We never add `role="group"` ourselves. Sometimes it's coming from SVG `<g>` elements, and sometimes we don't know where it's coming from.

- Variants: probably one per trigger we can identify, starting with SVG groups.
- Needs investigation: what else causes it.

#### `voiceover-treeitem`

VoiceOver and Safari have problems with `role="treeitem"`.

- Needs investigation: everything, including what the problem is.

#### `voiceover-region-announcements`

VoiceOver makes region announcements we didn't expect.

- Needs investigation: what setup triggers them. See the open question about whether this shares a page with `chromevox-region-announcements`.

#### `safari-moved-element-focus`

If you move a focused element to somewhere else in the DOM, Safari loses focus and refuses to read it.

- Variants: `broken`, plus whatever we did about it.

#### `safari-region-label-child-focused`

When you focus a region, Safari doesn't read the region's label if a child of the region was already focused.

- Variants: `broken`, plus whatever we did about it.

### ChromeVox

#### `chromevox-region-announcements`

ChromeVox is inconsistent about reading region announcements.

- Needs investigation: what "inconsistent" means in practice, and whether it's the same setup as `voiceover-region-announcements`.

#### `chromevox-repeated-reads`

ChromeVox reads the same focused node two or three times without the user changing anything.

- Needs investigation: what triggers it. We don't have a guess yet.

### JAWS

#### `jaws-application-combobox`

Inside a `role="application"` container, JAWS still reads interaction hints that don't apply. For a `role="combobox"`, JAWS says you can press down arrow to open the dropdown. In application mode keystrokes go straight to the app, so that's only true if the app happens to implement it, and the spec doesn't require it to.

- Variants: `broken` to start with. Workaround attempts to come.
- Note that this needs Windows and JAWS to verify, which narrows down who can do it.

### Focus problems

#### `focusout-on-removal`

When a focused element is removed from the DOM, Chrome and Firefox/Safari behave differently about whether a `focusout` event fires.

- This one doesn't need a screenreader at all. The page has a button that removes the focused element, and the event log shows which events fired.
- Needs investigation: which way round it is. This should be searchable, and there's probably a spec discussion about it.

## Testing

Testing is manual, with real screenreaders. At minimum, that means:

- VoiceOver with Safari on macOS.
- ChromeVox on ChromeOS.
- JAWS on Windows, probably with Chrome.

Each repro only needs testing with the combinations it claims to affect, plus at least one combination where it's expected to work correctly. A repro that's "broken" everywhere might just be a broken repro.

## Rejected options

### All repros on a single page

This is the simplest possible site, and the easiest to browse. It's also the one most likely to give wrong results, for the contamination reasons above. No go.

### Variants side by side on the same page

This would make comparing variants much easier for sighted readers. But two live regions on the same page will interfere with each other, and that interference is one of the bugs. We'd be adding exactly the noise the repro is trying to isolate.

### One HTML file per variant

This is the most faithful option, since every variant's markup would be parser-inserted. But it means a lot of near-duplicate HTML files, and the description and steps would drift out of sync between them. We're keeping it as the fallback for any repro where template cloning turns out to matter.

### Pointing readers at view source or GitHub instead of showing code

This is less work, but view source shows the whole page, with the description, the page chrome and every variant's template mixed in, and the repro markup is buried in the middle. GitHub is one more click and one more context switch. Both lose the "it looks so easy" moment, which is the reason for showing the code at all.

### Reading the code at runtime

The page could fill in its own code blocks by reading `template.innerHTML` and calling `toString()` on the setup function. That avoids a build step for the code blocks, but `innerHTML` is the browser's re-serialization rather than what we wrote, and `toString()` gives you esbuild's compiled JavaScript rather than our TypeScript, without the comments. Doing it at build time is barely more work, and it shows exactly what's in the repo.

### A UI framework

Frameworks own the rendering lifecycle, and several of these bugs are about the rendering lifecycle. A reader who sees the bug in a React repro could reasonably wonder whether React caused it. Vanilla TypeScript removes that question.

### Plain JavaScript with no build step

This would be the least tooling, and view source would show the exact code. TypeScript with esbuild is barely more tooling, and unminified output with source maps keeps the code readable. We went with TypeScript.

### Automated screenreader testing

Tools like Guidepup can drive VoiceOver and NVDA and capture what they say. It's tempting, but it doesn't cover ChromeVox or JAWS, and several of these bugs are timing-dependent in ways that would make automated tests flaky. The whole point of the site is for a human to hear the problem. If we end up re-verifying every repro against new screenreader versions often enough that it hurts, it's worth another look.

### Reproducing inside real Blockly

This would show the problems in context, but nobody wants to read through Blockly's rendering code to find the one `aria-*` attribute that matters. Minimal markup only.

## Open questions

- Do `voiceover-region-announcements` and `chromevox-region-announcements` come from the same setup? If so, they should probably be one page that's tested with both.
- Should `live-region-announcements` be split, with the overlap with automatic output as its own repro?
- Should we also test with NVDA? It isn't mentioned in any of the issues, but it's the most common free screenreader on Windows, and it would make a useful baseline for the JAWS repro.
- Where do the workaround references come from? I'll dig these up later, and they'll decide how many variants each repro has.
- Upstream bug links and tested versions, in a later pass.
- Does the page chrome actually need to avoid landmarks? Once a few region repros exist, we can test them with and without `<main>` and find out.
