export function setup(container: HTMLElement) {
  const [addButton, addWithTipButton] = container.querySelectorAll('button');
  const list = container.querySelector('ul')!;
  // One region for status messages and one for tips.
  const [status, tips] = container.querySelectorAll('[aria-live]');
  const lastText = new Map<Element, string>();

  function announce(region: Element, message: string) {
    // If the message is the same as the region's last one, add a
    // non-breaking space so the text still changes.
    const text = message === lastText.get(region) ? `${message} ` : message;
    region.textContent = text;
    lastText.set(region, text);
  }

  function addItem() {
    const item = document.createElement('li');
    item.textContent = `Item ${list.children.length + 1}`;
    list.append(item);
    announce(status, 'Item added.');
  }

  addButton.addEventListener('click', addItem);
  addWithTipButton.addEventListener('click', () => {
    addItem();
    announce(tips, 'Tip: new items go at the end of the list.');
  });
}
