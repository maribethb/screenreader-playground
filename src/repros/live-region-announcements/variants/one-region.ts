export function setup(container: HTMLElement) {
  const [addButton, addWithTipButton] = container.querySelectorAll('button');
  const list = container.querySelector('ul')!;
  const status = container.querySelector('[aria-live]')!;
  let lastText = '';

  function announce(message: string) {
    // If the message is the same as the last one, add a non-breaking space so
    // the text still changes.
    const text = message === lastText ? `${message} ` : message;
    status.textContent = text;
    lastText = text;
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
