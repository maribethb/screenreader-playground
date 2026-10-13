# Screenreader playground

Minimal reproductions of screenreader problems we ran into while making Blockly accessible, one static page per issue. Read [docs/design.md](docs/design.md) before working on a repro. It explains why the site is built the way it is, and the catalogue at the end records what we know about each issue. [docs/issues.md](docs/issues.md) links each issue to the Blockly issues and PRs where it came up. [README.md](README.md) has the commands and the steps for adding a repro.

## Writing repros

- Keep each repro self-contained. Don't share code between repros, and keep `src/shared/` limited to variant switching and the event log.
- The variant files are shown to readers as-is, so they should contain the minimal reproduction and nothing else. No glue, no page chrome, no defensive extras.
- Use generic web concepts in the code, steps and expected output: "move element", "add item", a plain `<div>` or `<ul>`. Not "move block", "insert block from the toolbox" or a "workspace". A reader who's never used Blockly should be able to follow the repro. Blockly can come up in the prose around it, like the "Actual output" and notes sections. See [Generic examples](docs/design.md#generic-examples-not-blockly-ones).
- Don't use landmarks or live regions in the page chrome. Several repros are about them.

## Git

This repo has no remote. "Merge to main" means merging into the local `main` branch, and there's nothing to push to, so don't offer to push or open a PR.

## Researching where an issue came from

Most repros start with figuring out what the bug actually was in Blockly, and it's easy to look in the wrong place.

Keyboard navigation and screenreader support started out in a separate repository and released plugin, [`RaspberryPiFoundation/blockly-keyboard-experimentation`](https://github.com/RaspberryPiFoundation/blockly-keyboard-experimentation). Its `main` branch uses an older approach to keyboard navigation and screenreader support that we fully replaced, and most if not all of the issues in this playground were found during the rewrite. Don't try to reproduce anything on `main` of `blockly-keyboard-experimentation`. The setup is completely different, so whatever you find there won't be the bug we're describing.

The rewrite happened on the `add-screen-reader-support-experimental` branches of both [`RaspberryPiFoundation/blockly`](https://github.com/RaspberryPiFoundation/blockly) and `blockly-keyboard-experimentation`. Work was slowly migrated from the plugin into core, so the same piece of code can live in the plugin at one point and in core at a later one. When you're tracking down an issue:

- Look on the `add-screen-reader-support-experimental` branches, not `main` of either repo.
- Find the commit that matters (usually from the issue or PR that mentions the bug or the workaround - [docs/issues.md](docs/issues.md) lists them for each repro) and check out that branch at that commit, not at the branch head. The head may have moved the code, worked around the bug, or removed it entirely.
- Check out the other repo at a commit from around the same time, so core and the plugin match. Mixing a recent plugin with an old core, or the other way round, gives you a setup that never existed.
- Write down the repo, branch and commit you used in the repro's notes, so whoever picks it up next can find the same code.
