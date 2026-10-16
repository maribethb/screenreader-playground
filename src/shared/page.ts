// Page glue shared by every repro: variant switching and the event log.
// Nothing in here is shown on the page, so keep repro logic out of it.

export type Setup = (container: HTMLElement) => void;

export interface ReproOptions {
  /** The variant shown when there's no ?variant= parameter. Usually the broken one. */
  defaultVariant: string;
  /** Every variant on the page. Use null for variants with no behavior. */
  variants: Record<string, Setup | null>;
}

export function initRepro({defaultVariant, variants}: ReproOptions) {
  const container = document.getElementById('repro');
  if (!container) throw new Error('Repro page is missing #repro');

  const id = new URLSearchParams(location.search).get('variant') || defaultVariant;
  if (!Object.hasOwn(variants, id)) {
    container.textContent = `Unknown variant "${id}".`;
    return;
  }

  // Single-variant repros have their markup inlined and no template.
  const template = document.querySelector<HTMLTemplateElement>(
    `template[data-variant="${id}"]`,
  );
  if (template) container.replaceChildren(template.content.cloneNode(true));

  for (const panel of document.querySelectorAll(
    `[data-variant-description="${id}"], [data-variant-code="${id}"]`,
  )) {
    panel.removeAttribute('hidden');
  }

  for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href^="?variant="]')) {
    if (link.getAttribute('href') === `?variant=${id}`) {
      link.setAttribute('aria-current', 'page');
    }
  }

  variants[id]?.(container);
}

/**
 * Appends a line to the page's #event-log. The log is deliberately not a live
 * region, so it never competes with the repro for the screenreader's attention.
 */
export function log(message: string) {
  const eventLog = document.getElementById('event-log');
  if (!eventLog) throw new Error('Repro page is missing #event-log');
  eventLog.append(`${message}\n`);
}
