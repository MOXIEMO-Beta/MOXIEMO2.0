import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

/**
 * Capture one or more on-page DOM nodes and stitch them into a single
 * multi-page A4 PDF. We render at 2x for crisp output and paginate by
 * slicing the tall canvas into A4-height strips.
 */
export async function exportStrategyPdf(opts: {
  sections: { id: string; title: string }[];
  fileName?: string;
  brandName?: string;
}) {
  const { sections, fileName = "moxie-strategy.pdf", brandName = "MOXIE" } = opts;

  const nodes = sections
    .map((s) => ({ ...s, el: document.getElementById(s.id) }))
    .filter((s): s is { id: string; title: string; el: HTMLElement } => !!s.el);

  if (nodes.length === 0) {
    toast.error("Nothing to export yet");
    return;
  }

  const t = toast.loading("Preparing PDF…");

  try {
    const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 32;
    const contentW = pageW - margin * 2;

    // Cover page
    pdf.setFillColor(20, 20, 20);
    pdf.rect(0, 0, pageW, pageH, "F");
    pdf.setTextColor(255, 220, 120);
    pdf.setFontSize(11);
    pdf.text(brandName.toUpperCase(), margin, margin + 20);
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(36);
    pdf.text("Marketing", margin, pageH / 2 - 20);
    pdf.text("foundation", margin, pageH / 2 + 22);
    pdf.setFontSize(11);
    pdf.setTextColor(180, 180, 180);
    pdf.text(new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }), margin, pageH - margin);

    for (let i = 0; i < nodes.length; i++) {
      const { el, title } = nodes[i];

      // Temporarily ensure node is visible/laid out at a fixed width for capture
      const prev = {
        position: el.style.position,
        left: el.style.left,
        top: el.style.top,
        width: el.style.width,
        display: el.style.display,
        background: el.style.background,
      };
      el.style.background = "#ffffff";

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: el.scrollWidth,
      });

      // Restore
      Object.assign(el.style, prev);

      const imgW = contentW;
      const imgH = (canvas.height * imgW) / canvas.width;

      pdf.addPage();
      // Section title bar
      pdf.setFillColor(245, 240, 230);
      pdf.rect(0, 0, pageW, 48, "F");
      pdf.setTextColor(20, 20, 20);
      pdf.setFontSize(10);
      pdf.text(brandName.toUpperCase() + " · STRATEGY", margin, 22);
      pdf.setFontSize(14);
      pdf.text(title, margin, 40);

      // If image fits on a single page, place it. Otherwise slice it.
      const topOffset = 64;
      const availableH = pageH - topOffset - margin;

      if (imgH <= availableH) {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        pdf.addImage(dataUrl, "JPEG", margin, topOffset, imgW, imgH);
      } else {
        // Slice the canvas into page-sized chunks
        const pxPerPt = canvas.width / imgW;
        const sliceHeightPx = availableH * pxPerPt;
        let renderedPx = 0;
        let firstSlice = true;
        while (renderedPx < canvas.height) {
          const sliceH = Math.min(sliceHeightPx, canvas.height - renderedPx);
          const slice = document.createElement("canvas");
          slice.width = canvas.width;
          slice.height = sliceH;
          const ctx = slice.getContext("2d")!;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, slice.width, slice.height);
          ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
          if (!firstSlice) {
            pdf.addPage();
            pdf.setFillColor(245, 240, 230);
            pdf.rect(0, 0, pageW, 48, "F");
            pdf.setTextColor(20, 20, 20);
            pdf.setFontSize(10);
            pdf.text(brandName.toUpperCase() + " · STRATEGY", margin, 22);
            pdf.setFontSize(14);
            pdf.text(title + " (cont.)", margin, 40);
          }
          const sliceDataUrl = slice.toDataURL("image/jpeg", 0.92);
          pdf.addImage(sliceDataUrl, "JPEG", margin, topOffset, imgW, sliceH / pxPerPt);
          renderedPx += sliceH;
          firstSlice = false;
        }
      }
    }

    // Footer page numbers
    const total = pdf.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      pdf.setPage(p);
      if (p === 1) continue; // skip cover
      pdf.setFontSize(9);
      pdf.setTextColor(140, 140, 140);
      pdf.text(`${p - 1} / ${total - 1}`, pageW - margin, pageH - 16, { align: "right" });
    }

    pdf.save(fileName);
    toast.success("PDF downloaded", { id: t });
  } catch (err) {
    console.error("PDF export failed", err);
    toast.error("Couldn't generate PDF", { id: t });
  }
}