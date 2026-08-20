import type jsPDF from "jspdf"

/**
 * Standard footer codes for generated reports.
 * Applied to every page of every PDF report so they comply with
 * the organization's document control format.
 */
export const PDF_FOOTER_LEFT = "RG-REC-054"
export const PDF_FOOTER_RIGHT = "RV.02"

/**
 * Adds the standard document-control footer to every page of a jsPDF document.
 *
 * - Left text: PDF_FOOTER_LEFT
 * - Right text: PDF_FOOTER_RIGHT
 *
 * The function preserves the caller's current font/size/color state so it
 * can be invoked just before `doc.save(...)` without affecting page contents.
 */
export function addReportFooter(
    doc: jsPDF,
    opts?: { left?: string; right?: string; margin?: number; bottom?: number; fontSize?: number }
): void {
    const left = opts?.left ?? PDF_FOOTER_LEFT
    const right = opts?.right ?? PDF_FOOTER_RIGHT
    const margin = opts?.margin ?? 14
    const bottom = opts?.bottom ?? 8
    const fontSize = opts?.fontSize ?? 8

    const docAny = doc as unknown as {
        internal: {
            getNumberOfPages: () => number
            pageSize: { getWidth?: () => number; getHeight?: () => number; width: number; height: number }
        }
        getFontSize: () => number
        getFont: () => { fontName: string; fontStyle: string }
        getTextColor: () => string
    }

    const totalPages = docAny.internal.getNumberOfPages()
    const pageSize = docAny.internal.pageSize
    const pageWidth = typeof pageSize.getWidth === "function" ? pageSize.getWidth() : pageSize.width
    const pageHeight = typeof pageSize.getHeight === "function" ? pageSize.getHeight() : pageSize.height

    // Snapshot caller's state so we don't affect anything previously drawn or upcoming.
    const prevFontSize = docAny.getFontSize()
    const prevFont = docAny.getFont()
    const prevColor = docAny.getTextColor()

    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(fontSize)
        doc.setTextColor(120, 120, 120)
        doc.text(left, margin, pageHeight - bottom, { align: "left" })
        doc.text(right, pageWidth - margin, pageHeight - bottom, { align: "right" })
    }

    // Restore previous state.
    doc.setFont(prevFont.fontName || "helvetica", prevFont.fontStyle || "normal")
    doc.setFontSize(prevFontSize || 10)
    doc.setTextColor(prevColor || "#000000")
}
