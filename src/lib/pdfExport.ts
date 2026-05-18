// src/lib/pdfExport.ts
// Paste this entire file into Lovable as src/lib/pdfExport.ts

// ─── STRATEGY 1: BROWSER PRINT (no dependencies) ────────────────
/**
 * exportViaPrint
 * Injects print-optimized styles, opens the browser print dialog,
 * then cleans up. Works immediately with no extra packages.
 */
export function exportViaPrint(
  recipientName: string = 'Founder',
  containerId: string = 'moxie-strategy-report'
) {
  const title = `MOXIEMO Strategic Report — ${recipientName} — ${formatFilenameDate()}`;
  const prevTitle = document.title;
  document.title = title;

  const styleId = 'moxie-print-overrides';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = buildPrintCSS(containerId);
    document.head.appendChild(style);
  }

  injectPageBreaks(containerId);
  window.print();

  setTimeout(() => {
    document.title = prevTitle;
    const injected = document.getElementById(styleId);
    if (injected) injected.remove();
  }, 1000);
}


// ─── STRATEGY 2: HTML2PDF (one-click download) ──────────────────
/**
 * exportViaHTML2PDF
 * One-click PDF download using html2pdf.js.
 * Falls back to print dialog if html2pdf.js is not installed.
 */
export async function exportViaHTML2PDF(
  containerId: string = 'moxie-report',
  recipientName: string = 'Founder'
) {
  let html2pdf: any;
  try {
    html2pdf = (await import('html2pdf.js')).default;
  } catch {
    console.warn('html2pdf.js not installed — falling back to print dialog.');
    exportViaPrint(recipientName, containerId);
    return;
  }

  const element = document.getElementById(containerId);
  if (!element) {
    console.error(`[MOXIEMO PDF] Element #${containerId} not found.`);
    return;
  }

  // Temporarily make visible (and on-screen) for html2canvas to measure & render.
  const parent = element.parentElement;
  const prevStyle = parent ? parent.getAttribute('style') : null;
  if (parent) {
    parent.setAttribute(
      'style',
      'position:fixed;top:0;left:0;width:794px;z-index:-1;background:white;opacity:0;pointer-events:none;'
    );
  }

  // Force layout flush before measuring
  void element.offsetHeight;

  const firstName = sanitizeFilename((recipientName || 'Founder').trim().split(/\s+/)[0] || 'Founder');
  const filename = `${firstName}-MOXIE-Strategy-Report.pdf`;

  const options = {
    margin:      [0, 0, 0, 0],
    filename,
    image:       { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale:           2,
      useCORS:         true,
      letterRendering: true,
      backgroundColor: '#f7f2eb',
      logging:                false,
      allowTaint:             true,
      foreignObjectRendering: false,
      windowWidth:            794,
      windowHeight:           1123,
    },
    jsPDF: {
      unit:        'px',
      format:      [794, 1123],
      orientation: 'portrait',
    },
    pagebreak: {
      mode:   ['css', 'legacy'],
      before: '.report-page',
      avoid:  '.report-card',
    },
  };

  // Disable export button while generating
  const btn = document.querySelector<HTMLButtonElement>('[data-pdf-export-btn]');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Generating PDF…';
  }

  try {
    await html2pdf().set(options).from(element).save();
  } catch (err) {
    console.error('[MOXIEMO PDF] Export failed:', err);
  } finally {
    // Restore hidden state on the parent wrapper
    if (parent) {
      if (prevStyle !== null) {
        parent.setAttribute('style', prevStyle);
      } else {
        parent.setAttribute('style', 'position:fixed;top:0;left:0;width:794px;height:1px;overflow:hidden;pointer-events:none;z-index:-9999;opacity:0;');
      }
    }
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Download PDF';
    }
  }
}


// ─── STRATEGY 3: SERVER-SIDE (future Puppeteer/Playwright) ──────
/**
 * exportViaServer
 * Calls a backend PDF generation endpoint.
 * Use when you need pixel-perfect output regardless of browser.
 * Requires: POST /api/report/export → returns application/pdf
 */
export async function exportViaServer(
  reportData: any,
  recipientName: string = 'Founder'
) {
  const filename = `MOXIE_Strategic_Report_${sanitizeFilename(recipientName)}_${formatFilenameDate()}.pdf`;

  const res = await fetch('/api/report/export', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ reportData, recipientName }),
  });

  if (!res.ok) throw new Error(`PDF export failed: ${res.statusText}`);

  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}


// ─── PRINT CSS ──────────────────────────────────────────────────
function buildPrintCSS(containerId: string): string {
  return `
    @media print {
      body > *:not(#${containerId}),
      .no-print,
      nav,
      header,
      [data-pdf-export-btn] {
        display: none !important;
      }

      body, html {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
      }

      #${containerId} {
        display: block !important;
        width: 100% !important;
      }

      .report-page {
        width: 794px !important;
        min-height: 1123px !important;
        margin: 0 !important;
        padding: 48px !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        page-break-after: always !important;
        break-after: page !important;
        overflow: hidden !important;
        position: relative !important;
      }

      .report-card,
      .report-row,
      .calendar-entry {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }

      @page {
        size: A4 portrait;
        margin: 0;
      }
    }
  `;
}


// ─── PAGE BREAK HELPER ──────────────────────────────────────────
function injectPageBreaks(containerId: string) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const pages = container.querySelectorAll('.report-page');
  pages.forEach((page, i) => {
    page.classList.add('page-break-before');
    if (i === pages.length - 1) {
      (page as HTMLElement).style.pageBreakAfter = 'avoid';
    }
  });
}


// ─── HELPERS ────────────────────────────────────────────────────
function formatFilenameDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 40);
}
