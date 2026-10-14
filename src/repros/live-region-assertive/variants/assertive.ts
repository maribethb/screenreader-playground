const SVG_NS = 'http://www.w3.org/2000/svg';

export function setup(container: HTMLElement) {
  const showButton = container.querySelector('button')!;
  const shapes = container.querySelector<SVGSVGElement>('.shapes')!;
  const canvas = container.querySelector('.canvas [role="region"]')!;
  const status = container.querySelector('[aria-live]')!;
  // Numbering the copies means following the steps never repeats a message,
  // so a repeated message being skipped can't be mistaken for this bug.
  let count = 0;

  showButton.addEventListener('click', () => {
    shapes.style.display = '';
    shapes.querySelector<SVGElement>('[role="treeitem"]')!.focus();
  });

  const addCopy = (shape: SVGElement) => {
    count++;
    const label = `${shape.getAttribute('aria-label')} ${count}`;
    const copy = document.createElementNS(SVG_NS, 'rect');
    copy.setAttribute('x', String((count - 1) * 50));
    copy.setAttribute('width', '40');
    copy.setAttribute('height', '40');
    copy.setAttribute('fill', shape.getAttribute('fill')!);
    copy.setAttribute('role', 'figure');
    copy.setAttribute('aria-roledescription', 'shape');
    canvas.append(copy);

    // Hide the shapes while one of them still has focus, then move focus to
    // the copy, and only then change the live region.
    shapes.style.display = 'none';
    copy.setAttribute('aria-label', label);
    copy.setAttribute('aria-selected', 'true');
    copy.setAttribute('tabindex', '-1');
    copy.focus();
    status.textContent = `Moving ${label}`;
  };

  for (const shape of shapes.querySelectorAll<SVGElement>('[role="treeitem"]')) {
    shape.addEventListener('focus', () => shape.setAttribute('aria-selected', 'true'));
    shape.addEventListener('blur', () => shape.setAttribute('aria-selected', 'false'));
    shape.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        addCopy(shape);
      }
    });
    shape.addEventListener('click', () => addCopy(shape));
  }
}
