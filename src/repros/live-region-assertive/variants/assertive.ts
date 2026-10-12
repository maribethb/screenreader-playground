export function setup(container: HTMLElement) {
  const [announceButton, insertButton] = container.querySelectorAll('button');
  const workspace = container.querySelector('.workspace')!;
  const status = container.querySelector('[aria-live]')!;
  // Numbering the messages means following the steps never repeats one, so a
  // repeated message being skipped can't be mistaken for this bug.
  let count = 0;

  announceButton.addEventListener('click', () => {
    count++;
    status.textContent = `Announcement ${count}`;
  });

  insertButton.addEventListener('click', () => {
    count++;
    const number = count;
    const block = document.createElement('button');
    block.type = 'button';
    block.textContent = `Block ${number}: repeat 10 times, do: say hello`;
    block.addEventListener('click', () => {
      status.textContent = `Moving block ${number}. Use the arrow keys to move it.`;
    });
    workspace.append(block);
    status.textContent = `Inserted block ${number}. Use the arrow keys to move it.`;
    block.focus();
  });
}
