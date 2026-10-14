export function setup(container: HTMLElement) {
  const button = container.querySelector('button')!;
  const notification = container.querySelector('[role="status"]')!;
  // Numbering the messages means pressing the button again never repeats one,
  // so a repeated message being skipped can't be mistaken for this bug.
  let count = 0;

  button.addEventListener('click', () => {
    count++;
    notification.textContent = `Notification ${count}`;
  });
}
