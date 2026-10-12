export function setup(container: HTMLElement) {
  const button = container.querySelector('button')!;
  const status = container.querySelector('[aria-live]')!;
  let timer: number | undefined;

  button.addEventListener('click', () => {
    // Clear the region first, so setting the same text again counts as a
    // change, then wait for clicks to stop before announcing.
    status.textContent = '';
    clearTimeout(timer);
    timer = setTimeout(() => {
      status.textContent = 'Block added';
    }, 250);
  });
}
