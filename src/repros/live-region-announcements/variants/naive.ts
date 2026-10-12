export function setup(container: HTMLElement) {
  const button = container.querySelector('button')!;
  const status = container.querySelector('[aria-live]')!;

  button.addEventListener('click', () => {
    status.textContent = 'Block added';
  });
}
