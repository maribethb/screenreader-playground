export function setup(container: HTMLElement) {
  const [addButton, addWithTipButton] = container.querySelectorAll('button');
  const list = container.querySelector('ul')!;
  const status = container.querySelector('[aria-live]')!;

  function announce(message: string) {
    // Add every message as a new paragraph and never remove the old ones.
    // The region isn't aria-atomic, so only the new paragraph should be read.
    const paragraph = document.createElement('p');
    paragraph.textContent = message;
    status.append(paragraph);
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
