export function setup(container: HTMLElement) {
  const [announceButton, addButton] = container.querySelectorAll('button');
  const items = container.querySelector('.items')!;
  const status = container.querySelector('[aria-live]')!;
  // Numbering the messages means following the steps never repeats one, so a
  // repeated message being skipped can't be mistaken for this bug.
  let count = 0;

  // The control: the live region changes and focus stays where it is.
  announceButton.addEventListener('click', () => {
    count++;
    status.textContent = `Announcement ${count}`;
  });

  // The live region changes, then focus moves to the new item, in the same task.
  addButton.addEventListener('click', () => {
    count++;
    const item = document.createElement('button');
    item.type = 'button';
    item.textContent = `Item ${count}: a button at the end of the list`;
    items.append(item);
    status.textContent = `Added item ${count}`;
    item.focus();
  });
}
