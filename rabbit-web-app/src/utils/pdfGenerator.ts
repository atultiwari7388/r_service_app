// utils/pdfGenerator.ts
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface PdfGenerationOptions {
  title: string;
  filename: string;
  format?: "a4" | "letter" | "legal";
  orientation?: "portrait" | "landscape";
  margin?: number;
}

export async function generatePdfFromElement(
  element: HTMLElement,
  options: PdfGenerationOptions
): Promise<void> {
  const {
    title,
    filename = "document.pdf",
    format = "a4",
    orientation = "portrait",
    margin = 10,
  } = options;

  try {
    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Calculate dimensions
    const imgWidth = pdfWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = margin;
    let heightLeft = imgHeight;
    let page = 1;

    // Add first page
    pdf.addImage(
      canvas,
      "PNG",
      margin,
      position,
      imgWidth,
      imgHeight,
      undefined,
      "FAST"
    );
    heightLeft -= pdfHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = margin - pdfHeight * page;
      pdf.addPage();
      pdf.addImage(
        canvas,
        "PNG",
        margin,
        position,
        imgWidth,
        imgHeight,
        undefined,
        "FAST"
      );
      heightLeft -= pdfHeight;
      page++;
    }

    // Save PDF
    pdf.save(filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF");
  }
}

export function openPdfInNewTab(pdfBlob: Blob, filename: string): void {
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const newWindow = window.open(pdfUrl, "_blank");
  if (!newWindow) {
    alert("Please allow popups for this site to view PDF");
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = filename;
    link.click();
  }
}
