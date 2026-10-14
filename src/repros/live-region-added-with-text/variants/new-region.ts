export function setup(container: HTMLElement) {
  const button = container.querySelector('button')!;
  // Numbering the messages means pressing the button again never repeats one,
  // so a repeated message being skipped can't be mistaken for this bug.
  let count = 0;

  button.addEventListener('click', () => {
    count++;
    container.querySelector('.notification')?.remove();
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.setAttribute('role', 'status');
    notification.setAttribute('aria-live', 'polite');
    notification.textContent = `Notification ${count}`;
    container.append(notification);
  });
}
