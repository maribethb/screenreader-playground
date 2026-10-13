export function setup(container: HTMLElement) {
  const [addButton, addWithTipButton] = container.querySelectorAll('button');
  const list = container.querySelector('ul')!;
  const status = container.querySelector('[aria-live]')!;
  let pending: string[] = [];
  let timer: number | undefined;
  let addSpace = false;

  function announce(message: string) {
    status.replaceChildren();
    // Every other message gets a non-breaking space, so the same message
    // twice in a row still changes the text.
    pending.push(addSpace ? `${message} ` : message);
    addSpace = !addSpace;
    // Wait for any other messages from the same action, then add them all
    // at once.
    clearTimeout(timer);
    timer = setTimeout(() => {
      for (const text of pending) {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        status.append(paragraph);
      }
      pending = [];
    }, 10);
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
