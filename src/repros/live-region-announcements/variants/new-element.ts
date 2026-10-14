export function setup(container: HTMLElement) {
  const [addButton, addWithTipButton] = container.querySelectorAll('button');
  const list = container.querySelector('ul')!;
  const announcements = container.querySelector('.announcements')!;

  function announce(message: string) {
    // A new live region for every message, so there's no previous message
    // for it to match.
    const region = document.createElement('div');
    region.setAttribute('aria-live', 'polite');
    announcements.append(region);
    // A region that already has text when it's added usually isn't
    // announced, so add the text a moment later.
    setTimeout(() => {
      region.textContent = message;
    }, 10);
    // Clean up once the message has had time to be read.
    setTimeout(() => region.remove(), 5000);
  }

  function addItem() {
    const item = document.createElement('li');
    item.textContent = `Item ${list.children.length + 1}`;
    list.append(item);
    announce('Item added.');
  }

  addButton.addEventListener('click', addItem);
  addWithTipButton.addEventListener('click', () => {
    addItem();
    announce('Tip: new items go at the end of the list.');
  });
}
