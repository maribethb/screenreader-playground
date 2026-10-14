# Issue list

This is the list of screenreader and browser issues for the playground. The first section covers the repros we already plan to build (from `design.md` and `repros.json`), with the Blockly issues and PRs where each problem came up. The second section covers problems that turned up in Blockly's GitHub but aren't on our list yet. The third section links to the work behind the parts of the article that aren't repros.

Links use `blockly#1234` for [RaspberryPiFoundation/blockly](https://github.com/RaspberryPiFoundation/blockly) and `kbx#123` for [RaspberryPiFoundation/blockly-keyboard-experimentation](https://github.com/RaspberryPiFoundation/blockly-keyboard-experimentation).

## Issues we're recreating

### ARIA spec issues

#### `live-region-assertive`: Assertive live region announcements are ignored

- [blockly#9436](https://github.com/RaspberryPiFoundation/blockly/pull/9436) made the live region assertive, because move mode announcements seemed like they should interrupt.
- [blockly#9460](https://github.com/RaspberryPiFoundation/blockly/issues/9460) is the cross-screenreader review that found the problem. **The user agent was VoiceOver.** With `assertive`, VoiceOver dropped the move mode announcement whenever a focus change also caused a block label to be read. With `polite` it was read after the block label. The working guess in the thread is that VoiceOver starts the assertive message and then the focus readout interrupts it.
- [blockly#9632](https://github.com/RaspberryPiFoundation/blockly/issues/9632) records the decision to default to `polite`.
- This page is historical context now. The bug turned out to be browser-specific and not about assertive, see `live-region-during-focus-change` below.

#### `live-region-announcements`: Repeated and overlapping live region announcements

[blockly#9460](https://github.com/RaspberryPiFoundation/blockly/issues/9460) is the main source here. It has a per-screenreader breakdown (NVDA, JAWS, ChromeVox, VoiceOver) and a comment listing every approach that was tried, which lines up almost exactly with our variant list:

1. Adding and removing live region elements, with a `setTimeout(…, 0)` before setting the text. Repeats and toasts were announced, but messages didn't interrupt each other, so the output fell behind during a move.
2. Two live regions (move and toast), adding a non-breaking space to force a repeated message to be read again. Move and toast messages didn't interrupt each other.
3. One live region, tracking the previous message. If one action triggered a move announcement and a toast at the same time, usually only one of them was read (sometimes neither).
4. Option 3 with a 10ms debounce. This was the only version that worked in all four screenreaders.
5. Appending spans to a single region with `aria-atomic="false"`. This worked everywhere except NVDA with Chrome, which re-read the whole region every time (see [NVDA + Chrome ignores `aria-atomic="false"`](#nvda--chrome-ignores-aria-atomicfalse) below).

Other findings from the same thread:

- NVDA and VoiceOver didn't re-announce a message if its text matched the previous one. ChromeVox did.
- NVDA, JAWS and VoiceOver didn't announce toast messages at all. ChromeVox did, but it also read the toast's close button and the word "status".
- Ben noted that TalkBack ignores assertive regions that are "too spammy". We haven't tested this.

Follow-up work:

- [blockly#9524](https://github.com/RaspberryPiFoundation/blockly/pull/9524): toasts announced, repeated messages announced, and the debounce. It was closed without being merged, and the debounce reached core through blockly#9653 instead.
- [blockly#9653](https://github.com/RaspberryPiFoundation/blockly/pull/9653): the live region in core.
- [blockly#9762](https://github.com/RaspberryPiFoundation/blockly/issues/9762) → [blockly#9778](https://github.com/RaspberryPiFoundation/blockly/pull/9778): last-write-wins debounce dropped the move hint toast, so messages are now coalesced. That's probably another variant.
- [blockly#9801](https://github.com/RaspberryPiFoundation/blockly/issues/9801) → [blockly#9817](https://github.com/RaspberryPiFoundation/blockly/pull/9817): once messages were coalesced, they ran together into one sentence. Separating them with newlines didn't work in VoiceOver, so we added punctuation instead.

#### `live-region-added-with-text`: Live regions added with their text already in them aren't read

- [blockly#9460](https://github.com/RaspberryPiFoundation/blockly/issues/9460) found that NVDA, JAWS and VoiceOver didn't read toasts at all. ChromeVox did, plus the close button and "status". At the tested commit (`74a36d7`), `Toast.createDom` made each toast its own polite `role="status"` element and filled it in the same task. The thread's first approach, adding the element and setting its text in a `setTimeout(…, 0)`, got toasts read.
- [blockly#9524](https://github.com/RaspberryPiFoundation/blockly/pull/9524) tried sending toasts through the shared live region, and was closed without merging.
- [blockly#9667](https://github.com/RaspberryPiFoundation/blockly/issues/9667) → [blockly#9672](https://github.com/RaspberryPiFoundation/blockly/pull/9672): toasts announced through the shared live region, which is what shipped.

#### `headings-in-lists`: Headings inside list items

- [blockly#9618](https://github.com/RaspberryPiFoundation/blockly/issues/9618): flyout labels are announced as headings, so experienced users pressed H to jump between them and nothing happened. The issue isn't sure whether that's because they aren't real headings or because of `role="application"`.
- [blockly#9874](https://github.com/RaspberryPiFoundation/blockly/pull/9874) added our own H / Shift+H shortcuts as the workaround.
- **Caution for the repro:** inside `role="application"`, the screenreader's browse-mode keys (like H) are supposed to go to the page, so H not working there is expected behavior. The repro should test headings in lists *without* `role="application"` first, or we risk blaming lists for something the application role caused.

#### `lifecycle-timing`: `tabindex` and `aria-*` changes depend on rendering lifecycle timing

We found several examples of the "right point in the lifecycle" problem:

- [blockly#10073](https://github.com/RaspberryPiFoundation/blockly/pull/10073), commit "compute aria context for rendered conns at draw time": if the role and roledescription were only set when the element received focus, VoiceOver with Safari said nothing on the first focus. They have to be there before focus.
- [blockly#9885](https://github.com/RaspberryPiFoundation/blockly/issues/9885) (part 1) and [blockly#10033](https://github.com/RaspberryPiFoundation/blockly/pull/10033): screenreaders read a region's label when focus moves into one of its children. The workspace only updated its label when the workspace itself got focus, so the stale label ("0 stacks of blocks") was read. The fix updates the label in `onTreeFocus`, before the element is focused.
- [blockly#9394](https://github.com/RaspberryPiFoundation/blockly/pull/9394): toolbox and flyout item counts were wrong partly because the labels were computed "too early (i.e. before the categories were fully populated)".
- [blockly#9361](https://github.com/RaspberryPiFoundation/blockly/pull/9361): a block's label depends on its field's focusable element, which can throw if you ask for it too early, so label computation moved into `initSvg()`.
- [blockly#9079](https://github.com/RaspberryPiFoundation/blockly/pull/9079): reading the `.tabIndex` property can return `-1` or `0` when no `tabindex` attribute is set, so we had to use `getAttribute('tabindex')` instead. That's not really a timing problem, but it's another case where the tabindex you see isn't what you set.

#### Skipped: `role="none"` not removing elements

Two things we found back up the "only when focusable" theory, if we ever want to revisit this:

- [blockly#9449](https://github.com/RaspberryPiFoundation/blockly/pull/9449): Ben found that `presentation`/`none` is ignored when the element has focusable children (the spec's presentational role conflict rules), and switched to `generic` for a while.
- [blockly#9445](https://github.com/RaspberryPiFoundation/blockly/pull/9445): an element with `role="presentation"`, no other ARIA, and a negative `tabindex` was still read when focused. The browser fell back to a default description ("Graphics Symbol" for a block's path).

### VoiceOver

#### `voiceover-group`: VoiceOver says "group" a lot

- [blockly#9449](https://github.com/RaspberryPiFoundation/blockly/pull/9449): switching hidden containers from `presentation` to `generic` seemed to reduce "group" in the workspace, but flyout items still said "group". The only thing that stopped it was adding an `aria-roledescription`. There's also a comment that VoiceOver users online describe "group" as a quirk they've learned to live with.
- [blockly#9664](https://github.com/RaspberryPiFoundation/blockly/issues/9664) / [blockly#9697](https://github.com/RaspberryPiFoundation/blockly/pull/9697) made `generic` the default role for every SVG `<svg>` and `<g>`. Then [blockly#9774](https://github.com/RaspberryPiFoundation/blockly/pull/9774) switched them back to `presentation`, on the grounds that authors aren't meant to use `generic`. Probably worth a variant each.
- [blockly#9485](https://github.com/RaspberryPiFoundation/blockly/pull/9485): VoiceOver says "group" where other screenreaders say "region".
- [blockly#9420](https://github.com/RaspberryPiFoundation/blockly/issues/9420): a dropdown field was read as "first, group".
- [blockly#9424](https://github.com/RaspberryPiFoundation/blockly/pull/9424) removed an extra "group" from menu items.
- [kbx#789](https://github.com/RaspberryPiFoundation/blockly-keyboard-experimentation/issues/789): full-block fields in the flyout (Zelos) were read as just "group". The `listitem` role was on a `<path>`, while all the useful ARIA was on a sibling `<g>` with `aria-hidden="true"`. In this case, at least, it was our bug.

#### `voiceover-treeitem`: VoiceOver and Safari problems with `role="treeitem"`

- [blockly#9412](https://github.com/RaspberryPiFoundation/blockly/pull/9412) removed `tree`/`treeitem` from the workspace, partly because "VoiceOver has mixed support for trees and tree items".
- [blockly#9313](https://github.com/RaspberryPiFoundation/blockly/issues/9313) (Ben's comment): "specific combinations of Mac VoiceOver with Chrome can result in tree items completely misbehaving". **This means VoiceOver with Chrome may be affected too, not just Safari.** `repros.json` currently says Safari only.
- [blockly#9293](https://github.com/RaspberryPiFoundation/blockly/issues/9293): VoiceOver read "x of y" for top-level tree items but not for nested ones. ChromeVox seemed to ignore our manually set `aria-posinset`.
- [blockly#9295](https://github.com/RaspberryPiFoundation/blockly/issues/9295) / [blockly#9363](https://github.com/RaspberryPiFoundation/blockly/pull/9363): cloning a block's path for the selection highlight also cloned its `treeitem` role, which added a phantom item to the count.
- [blockly#9528](https://github.com/RaspberryPiFoundation/blockly/pull/9528): with the flyout as `role="menu"`, VoiceOver with Chrome stopped reading the toolbox tree categories entirely. Changing the flyout to almost any other role fixed it. Only one of two testers could reproduce this.

#### `voiceover-region-announcements`: Unexpected region announcements in VoiceOver

- [blockly#9835](https://github.com/RaspberryPiFoundation/blockly/issues/9835) / [blockly#9841](https://github.com/RaspberryPiFoundation/blockly/pull/9841): the workspace's `aria-label` was updated on every workspace change, and VoiceOver re-read the region label each time, even with focus on a block.
- [blockly#9798](https://github.com/RaspberryPiFoundation/blockly/issues/9798): dropdowns and widgets live outside the workspace in the DOM, so closing one counts as entering the region again and the label is re-read. Proposed fix: `aria-owns`. (Related to [Popups outside the region](#popups-outside-the-region-cause-region-exitenter-announcements) below.)
- [blockly#9885](https://github.com/RaspberryPiFoundation/blockly/issues/9885) gives VoiceOver's rules as tested: it reads a region's label when the region or one of its children gets focus, but only if nothing in that region was focused before.

#### `safari-moved-element-focus`: Safari loses focus when a focused element is moved

- [blockly#10032](https://github.com/RaspberryPiFoundation/blockly/pull/10032) brought focused blocks to the front by re-appending them, which moved the focused element in the DOM. VoiceOver with Safari then stopped reading newly focused blocks ([blockly#10066](https://github.com/RaspberryPiFoundation/blockly/issues/10066)).
- [blockly#10073](https://github.com/RaspberryPiFoundation/blockly/pull/10073) is the workaround, and probably our variant list:
  - Don't move the element that's about to be focused. Move its siblings before it instead.
  - Do the reordering inside `requestAnimationFrame` to stop the VoiceOver cursor flickering.
  - Don't toggle `display: none` on focusable elements. VoiceOver with Safari is "flakey at best" with them, so toggle a class instead. This could be its own repro.
- [blockly#9081](https://github.com/RaspberryPiFoundation/blockly/issues/9081), [blockly#9082](https://github.com/RaspberryPiFoundation/blockly/pull/9082) and [kbx#87](https://github.com/RaspberryPiFoundation/blockly-keyboard-experimentation/issues/87) cover the same move from the focus-event side: Chrome fires a focus change when a focused element is moved, and Firefox and Safari don't. See also `focusout-on-removal`.

#### `safari-region-label-child-focused`: Safari skips the region label when a child was already focused

- [blockly#9885](https://github.com/RaspberryPiFoundation/blockly/issues/9885) (part 2): pressing W to move focus from a block to its parent workspace region produced no output, and the VoiceOver cursor didn't move. NVDA, JAWS, Narrator and ChromeVox all worked. The thread says VoiceOver but doesn't say which browser, so this may not be Safari-specific.
- Things that were tried: blur then focus (needed a `tabindex` on `body` plus a delay on Safari, and still wasn't reliable), and announcing it through the live region instead (felt slow).
- [blockly#9939](https://github.com/RaspberryPiFoundation/blockly/pull/9939) was a temporary fix that dropped the stack count on Apple devices.
- [blockly#10087](https://github.com/RaspberryPiFoundation/blockly/pull/10087) is the real fix: focus a separate non-ancestor element inside the region (the workspace's selection rect) instead of the region itself. The PR notes this works better if that element isn't a `<g>`.

#### `live-region-during-focus-change`: Live region messages set while moving focus aren't read

- [blockly#9460](https://github.com/RaspberryPiFoundation/blockly/issues/9460): with VoiceOver, inserting a block from the toolbox never read the move announcement while the region was assertive, and read it after the block's name when it was polite. We found that in Chrome it's lost either way (unless the old and new focus share a container Chrome keeps in its accessibility tree) and Safari reads it either way, so this doesn't match, and the thread doesn't say which browser was used. The thread's 10 ms debounce "fixes the 'insert from flyout' problem", which fits, since it sets the text in a later task. On our page a 0 ms `setTimeout` only works some of the time, so we don't know how reliable 10 ms is.
- [blockly#9436](https://github.com/RaspberryPiFoundation/blockly/pull/9436) made the region assertive, and [blockly#9632](https://github.com/RaspberryPiFoundation/blockly/issues/9632) → [blockly#9653](https://github.com/RaspberryPiFoundation/blockly/pull/9653) made polite the default again.

### ChromeVox

#### `chromevox-region-announcements`: ChromeVox is inconsistent about region announcements

- [blockly#9451](https://github.com/RaspberryPiFoundation/blockly/issues/9451): in a mutator workspace nested inside the main one, ChromeVox read "region end" only on the last (or second) block, and the region name only in the mutator's flyout.
- [blockly#9485](https://github.com/RaspberryPiFoundation/blockly/pull/9485): "region" was usually appended to the end of the readout when moving between the toolbox and flyout, but "region end" was rarely read. The fix removed nested regions.
- [blockly#9449](https://github.com/RaspberryPiFoundation/blockly/pull/9449): adding `aria-owns` made ChromeVox read "region end" when moving between an `if` block and its first child, with no region involved. See [`aria-owns` changes navigation](#aria-owns-changes-navigation-not-just-the-tree) below.
- [blockly#9449](https://github.com/RaspberryPiFoundation/blockly/pull/9449) also tried `role="application"` and found ChromeVox then treated it like a landmark, which made things worse. Since we shipped `role="application"` later ([blockly#9747](https://github.com/RaspberryPiFoundation/blockly/pull/9747)), it's worth checking whether this still happens.

#### `chromevox-repeated-reads`: ChromeVox reads the same focused node more than once

Nothing found on GitHub. It may only exist in the design doc, chat, or [the screen reader discussion (kbx#673)](https://github.com/RaspberryPiFoundation/blockly-keyboard-experimentation/discussions/673), which I didn't search.

### JAWS

#### `jaws-application-combobox`: JAWS reads combobox hints inside `role="application"`

- [blockly#9313](https://github.com/RaspberryPiFoundation/blockly/issues/9313) has the user testing feedback. JAWS says something like "press down to edit" on dropdowns, but down moves away. An NVDA user who had sounds set up for comboboxes also noticed that down didn't open them. Two alternatives were floated: make every interactive input a button with `aria-haspopup`, or keep the roles. Testers didn't like `button` for input fields because it implies an action.
- Same thread: a later commit ([b8c7dc2](https://github.com/RaspberryPiFoundation/blockly/commit/b8c7dc263c41b17abc962724ae160ea88c6771a6)) was needed because VoiceOver said "collapsed, completion selected" after choosing a dropdown value, instead of the new label.
- [blockly#9384](https://github.com/RaspberryPiFoundation/blockly/pull/9384) explains how the combobox pattern is set up (`aria-activedescendant`, the menu ID).

### Focus problems

#### `focusout-on-removal`: `focusout` when a focused element is removed

- **Chrome is the one that fires.** [blockly#9763](https://github.com/RaspberryPiFoundation/blockly/pull/9763) says removing a focused element fires `focusout` in Chrome but not in Firefox or Safari, "due to an ambiguity in the spec. That has since been resolved, but Chrome has not (yet?) updated its behavior". This answers the open question in `design.md`, but we still need the spec link. The workaround was to restore focus before removing the dropdown div.
- [blockly#9759](https://github.com/RaspberryPiFoundation/blockly/issues/9759) is the symptom: focus fell to `document.body` after using a dropdown, Chrome only.

## Issues not on our list yet

Rough order: most worth a repro first.

### Narrator ignores `aria-label` on `role="listitem"`

[blockly#10058](https://github.com/RaspberryPiFoundation/blockly/issues/10058) (originally [microsoft/pxt-microbit#6951](https://github.com/microsoft/pxt-microbit/issues/6951)): Windows Narrator ignores `aria-label` on a `listitem` and reads the item's content instead. In our case, that was the first letter of the first text element. [blockly#10059](https://github.com/RaspberryPiFoundation/blockly/pull/10059) fixed it by switching from `list`/`listitem` to `listbox`/`option`, which then needed `aria-owns` on icons to stop the item count going up. It's small and easy to reproduce, and it's a good example of "use the semantic role" backfiring.

This doesn't fit any of our current categories. We may want a Narrator section, which would also need Windows for testing.

### NVDA + Chrome ignores `aria-atomic="false"`

From [blockly#9460](https://github.com/RaspberryPiFoundation/blockly/issues/9460): when spans were appended to a single live region, NVDA with Chrome re-read the whole region every time. NVDA with Firefox only read the new content. The author said that without this bug, appending would have been their preferred approach. This could be a variant of `live-region-announcements`, but it's a distinct browser bug, so it may deserve its own page.

### Decorative or unfocusable elements inflate "x of y" counts

VoiceOver counts sibling elements that have (or keep) a role, even when they can't be focused. We hit this over and over:

- toolbox separators: [blockly#10150](https://github.com/RaspberryPiFoundation/blockly/issues/10150) → [blockly#10153](https://github.com/RaspberryPiFoundation/blockly/pull/10153) ("Item 8 of 7")
- Zelos's SVG dropdown arrow, outline path, and full-block field paths: [blockly#10500](https://github.com/RaspberryPiFoundation/blockly/pull/10500)
- a cloned selection path: [blockly#9295](https://github.com/RaspberryPiFoundation/blockly/issues/9295)
- rendered connections that were given a role so Safari would read them on first focus: [blockly#10073](https://github.com/RaspberryPiFoundation/blockly/pull/10073) → [blockly#10075](https://github.com/RaspberryPiFoundation/blockly/pull/10075)
- `aria-owns` used to tuck icons under their block: [blockly#10059](https://github.com/RaspberryPiFoundation/blockly/pull/10059)

The connections case is a nice trap: fixing one VoiceOver bug (no readout on first focus) caused another (wrong counts).

### `aria-owns` changes navigation, not just the tree

[blockly#9449](https://github.com/RaspberryPiFoundation/blockly/pull/9449) and [blockly#9528](https://github.com/RaspberryPiFoundation/blockly/pull/9528): adding `aria-owns` so that the accessibility tree hierarchy was *more* correct caused the VoiceOver cursor to stop following focus (navigating up from a statement inside an `if` block). It also made ChromeVox read "region end" where there was no region. The idea that `aria-owns` only fixes up the hierarchy turned out to be wrong.

### Popups outside the region cause region exit/enter announcements

[blockly#9451](https://github.com/RaspberryPiFoundation/blockly/issues/9451) and [blockly#9798](https://github.com/RaspberryPiFoundation/blockly/issues/9798): dropdown menus and text editors are appended outside the workspace in the DOM (very common for popups). Opening and closing one counts as leaving and re-entering the region, so screenreaders announce "region end" and then the region label again. Lots of web apps would hit this, so it's probably a good one for the article. It might be the same setup as `voiceover-region-announcements`.

### Labels need different punctuation on Apple

[blockly#10185](https://github.com/RaspberryPiFoundation/blockly/issues/10185) → [blockly#10279](https://github.com/RaspberryPiFoundation/blockly/pull/10279): VoiceOver adds its own pause (a comma) between `aria-label` and `aria-roledescription`. NVDA and JAWS don't, so the label runs straight into the role ("has input statement"). The fix adds a trailing comma everywhere except Apple devices. This is a good concrete example of the article's "no real way to influence the prosody" point.

Related prosody issues that are smaller, and mostly our own fault:

- [blockly#9906](https://github.com/RaspberryPiFoundation/blockly/issues/9906) → [blockly#9926](https://github.com/RaspberryPiFoundation/blockly/pull/9926): "⌘ Command" was read as "command Command".
- [kbx#793](https://github.com/RaspberryPiFoundation/blockly-keyboard-experimentation/issues/793): the shortcuts table was read as "E-S-C" and "enter slash space".
- [blockly#9801](https://github.com/RaspberryPiFoundation/blockly/issues/9801): VoiceOver ignored newlines between coalesced live region messages.

### Same markup, four different readouts

[blockly#9420](https://github.com/RaspberryPiFoundation/blockly/issues/9420): a dropdown field with its text element exposed (`aria-hidden="false"`) was read as:

- ChromeVox: "field_dropdown first Collapsed Combo box"
- VoiceOver: "first, group"
- NVDA: "first, section"
- JAWS: "end group, first"

With the text hidden, VoiceOver and NVDA identified the combobox but lost the current value. This isn't exactly a bug, but a page showing one element and four transcripts makes the "you have to test every combination" point very quickly.

### Missing or extra region and container announcements

- [blockly#9464](https://github.com/RaspberryPiFoundation/blockly/issues/9464) / [blockly#9483](https://github.com/RaspberryPiFoundation/blockly/pull/9483): JAWS didn't announce region changes at all, whatever the verbosity settings, and NVDA sometimes skipped region labels. The workaround was to label the inner `tree` as well as the region, which makes ChromeVox say it twice.
- [blockly#9317](https://github.com/RaspberryPiFoundation/blockly/issues/9317) / [blockly#9370](https://github.com/RaspberryPiFoundation/blockly/pull/9370): NVDA said "graphic" when moving into the flyout, because of the flyout's `<svg>` root.
- [blockly#9356](https://github.com/RaspberryPiFoundation/blockly/pull/9356): when a flyout button had `role="button"`, VoiceOver drew its focus ring around the whole flyout.

### Narrator scan mode and Tab

[kbx#672](https://github.com/RaspberryPiFoundation/blockly-keyboard-experimentation/issues/672): with Narrator, Tab moved through static text inside blocks that had no `tabindex`. It turned out to be Narrator's scan mode, which browsers turn on automatically. Rachel also saw Narrator's cursor drift away from focus in scan mode. This is probably more of a note than a repro.

### Speech synthesis is disabled while a screenreader is on

[blockly#9445](https://github.com/RaspberryPiFoundation/blockly/pull/9445) (experiment): the Web Speech API seemed to be completely disabled while ChromeVox was running. That's relevant if the article talks about why we couldn't just produce our own speech output.

## Article background (not repros)

These are linked from the article draft's general sections. None of them need a repro, but they might be useful as citations.

- **Looping vs. screenreader users:** [blockly#9496](https://github.com/RaspberryPiFoundation/blockly/issues/9496), [blockly#9707](https://github.com/RaspberryPiFoundation/blockly/issues/9707), [blockly#9732](https://github.com/RaspberryPiFoundation/blockly/pull/9732)
- **Screenreader mode:** [blockly#9861](https://github.com/RaspberryPiFoundation/blockly/issues/9861), [blockly#9869](https://github.com/RaspberryPiFoundation/blockly/pull/9869)
- **The shortcut saga:** [blockly#9877](https://github.com/RaspberryPiFoundation/blockly/issues/9877) / [blockly#9892](https://github.com/RaspberryPiFoundation/blockly/pull/9892) (Cmd+Option+Z opens devtools in Firefox), [blockly#10060](https://github.com/RaspberryPiFoundation/blockly/issues/10060) (Ctrl+Alt+Z toggles ChromeVox; includes a table of how other apps do it), [blockly#10089](https://github.com/RaspberryPiFoundation/blockly/pull/10089) (moved to Alt+Shift+A)
- **Earcons:** [blockly#9518](https://github.com/RaspberryPiFoundation/blockly/pull/9518), [blockly#9521](https://github.com/RaspberryPiFoundation/blockly/pull/9521), [blockly#9500](https://github.com/RaspberryPiFoundation/blockly/issues/9500)
- **First focus and usage hints:** [blockly#9621](https://github.com/RaspberryPiFoundation/blockly/issues/9621), [blockly#9871](https://github.com/RaspberryPiFoundation/blockly/pull/9871), [blockly#9969](https://github.com/RaspberryPiFoundation/blockly/issues/9969) / [blockly#9974](https://github.com/RaspberryPiFoundation/blockly/pull/9974) (users missed that they'd entered the workspace when focus went straight to a block)
- **Choosing roles without semantic HTML:** [blockly#9313](https://github.com/RaspberryPiFoundation/blockly/issues/9313), [blockly#9412](https://github.com/RaspberryPiFoundation/blockly/pull/9412) (`figure` for blocks), [blockly#9528](https://github.com/RaspberryPiFoundation/blockly/pull/9528) (tree → menu → list), [blockly#10059](https://github.com/RaspberryPiFoundation/blockly/pull/10059) (list → listbox)
- **Ben's "backed into a design corner" comment** in [blockly#9449](https://github.com/RaspberryPiFoundation/blockly/pull/9449) (presentation vs. `aria-hidden` vs. `aria-owns` with SVG) is a good summary of why semantic-HTML advice doesn't transfer to SVG.

## How this list was made

I searched issues and PRs created since June 2024 in both repos for screenreader names, ARIA terms, and browser names, then read the threads that looked relevant. I didn't search the [kbx#673 discussion](https://github.com/RaspberryPiFoundation/blockly-keyboard-experimentation/discussions/673), the Google Docs design docs, or MakeCode's repos, and those probably have more.
