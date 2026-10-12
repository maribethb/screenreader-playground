export function setup(container: HTMLElement) {
  const [announceButton, insertButton] = container.querySelectorAll('button');
  const workspace = container.querySelector('.workspace')!;
  const status = container.querySelector('[aria-live]')!;
  // Numbering every message means no two are the same, so a repeated message
  // being skipped can't be mistaken for this bug.
  let count = 0;

  // The control: the live region changes and nothing else happens.
  announceButton.addEventListener('click', () => {
    count++;
    status.textContent = `Announcement ${count}`;
  });

  // What Blockly does when you insert a block: focus moves to the new block,
  // so the screenreader starts reading it, and the live region changes in the
  // same click handler.
  insertButton.addEventListener('click', () => {
    count++;
    const block = document.createElement('button');
    block.type = 'button';
    block.textContent = `Block ${count}: repeat 10 times, do: say hello`;
    workspace.append(block);
    block.focus();
    status.textContent = `Moving block ${count}. Use the arrow keys to move it.`;
  });
}
