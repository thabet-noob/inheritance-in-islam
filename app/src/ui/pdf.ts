/**
 * PDF export that looks the same on every device.
 *
 * Mobile print engines lay a page out at phone width, which turns the report into many pages.
 * Instead, the report is rendered in a hidden same-origin iframe at laptop width (so the desktop
 * media queries apply), each report block is captured as an image by the browser itself (so
 * Arabic shaping is exact), and the blocks are packed onto A4 pages with jsPDF.
 */

const STATE_KEY = 'pdf-export-state';
const FRAME_WIDTH = 820; // px: desktop layout, close to A4 content width so text stays readable

export const isExportMode = () => new URLSearchParams(window.location.search).get('export') === '1';

export function readExportState<T>(): T | null {
  try {
    const raw = sessionStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Runs in the parent page: render the report in a hidden laptop-width frame and download the PDF. */
export async function exportPdf(state: unknown, fileName: string): Promise<void> {
  sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  Object.assign(frame.style, {
    position: 'fixed',
    top: '0',
    left: '-10000px',
    width: `${FRAME_WIDTH}px`,
    height: '1200px',
    border: '0',
    pointerEvents: 'none',
  });
  frame.src = `${window.location.pathname}?export=1`;

  try {
    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const timer = window.setTimeout(() => done(() => reject(new Error('PDF export timed out'))), 45000);
      const onMessage = (e: MessageEvent) => {
        if (e.source !== frame.contentWindow || e.origin !== window.location.origin) return;
        if (e.data?.type === 'pdf') done(() => resolve(e.data.buffer as ArrayBuffer));
        if (e.data?.type === 'pdf-error') done(() => reject(new Error(e.data.message)));
      };
      const done = (fn: () => void) => {
        window.clearTimeout(timer);
        window.removeEventListener('message', onMessage);
        fn();
      };
      window.addEventListener('message', onMessage);
      document.body.appendChild(frame);
    });
    download(new Blob([buffer], { type: 'application/pdf' }), fileName);
  } finally {
    frame.remove();
    sessionStorage.removeItem(STATE_KEY);
  }
}

function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r(null)));

/** Runs inside the export frame: capture every [data-pdf-block] and pack them onto A4 pages. */
export async function buildPdf(): Promise<ArrayBuffer> {
  const [{ toCanvas }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')]);
  await document.fonts.ready;
  await nextFrame();
  await nextFrame();

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  const MARGIN = 12;
  const GAP = 4;
  const pageW = 210 - 2 * MARGIN;
  const pageH = 297 - 2 * MARGIN;
  let y = MARGIN;

  const blocks = [...document.querySelectorAll<HTMLElement>('[data-pdf-block]')].filter((el) => el.offsetHeight > 0);
  for (const el of blocks) {
    const options = { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true };
    await toCanvas(el, options); // first pass warms up fonts (needed by Safari)
    const canvas = await toCanvas(el, options);

    let w = pageW;
    let h = (canvas.height / canvas.width) * pageW;
    if (h > pageH) {
      // taller than a page: shrink to fit one page
      w *= pageH / h;
      h = pageH;
    }
    if (y > MARGIN && y + h > MARGIN + pageH) {
      pdf.addPage();
      y = MARGIN;
    }
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', MARGIN + (pageW - w) / 2, y, w, h, undefined, 'FAST');
    y += h + GAP;
  }
  return pdf.output('arraybuffer');
}
