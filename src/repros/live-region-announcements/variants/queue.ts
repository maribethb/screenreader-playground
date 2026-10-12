export function setup(container: HTMLElement) {
  const button = container.querySelector('button')!;
  const status = container.querySelector('[aria-live]')!;
  const queue: string[] = [];
  let speaking = false;

  function announce(message: string) {
    queue.push(message);
    if (!speaking) next();
  }

  function next() {
    const message = queue.shift();
    if (message === undefined) {
      speaking = false;
      return;
    }
    speaking = true;
    // Empty the region and give the screenreader a moment to notice, so a
    // repeated message still counts as a change.
    status.textContent = '';
    setTimeout(() => {
      status.textContent = message;
      // There's no event for "the screenreader finished speaking", so guess.
      setTimeout(next, 1000);
    }, 100);
  }

  button.addEventListener('click', () => announce('Block added'));
}
