// Node environment is required for real binary PDF parser behavior.
// @vitest-environment node
import { PDFDocument, PDFName, PDFString } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { validatePdf } from "@/lib/pathway/files";
import { MAX_CV_BYTES } from "@/lib/pathway/schema";

describe("private CV validation", () => {
  it("accepts a real synthetic PDF", async () => {
    const doc = await PDFDocument.create();
    doc.addPage();
    await expect(
      validatePdf(
        await doc.save({ useObjectStreams: false }),
        "application/pdf",
        "cv.pdf",
      ),
    ).resolves.toBeUndefined();
  });
  it("rejects malformed, disguised and oversized documents", async () => {
    for (const bytes of [
      new TextEncoder().encode("%PDF-1.4 not a real PDF %%EOF"),
      new TextEncoder().encode("<html>not a PDF</html>"),
      new Uint8Array(MAX_CV_BYTES + 1),
    ]) {
      await expect(
        validatePdf(bytes, "application/pdf", "cv.pdf"),
      ).rejects.toThrow();
    }
  });
  it("rejects active PDF content even when structurally valid", async () => {
    const doc = await PDFDocument.create();
    doc.addPage();
    doc.catalog.set(PDFName.of("OpenAction"), PDFString.of("unsafe"));
    await expect(
      validatePdf(
        await doc.save({ useObjectStreams: false }),
        "application/pdf",
        "cv.pdf",
      ),
    ).rejects.toThrow();
  });
  it("rejects compressed object expansion before invoking the parser", async () => {
    const doc = await PDFDocument.create();
    doc.addPage();
    doc.context.register(PDFString.of("A".repeat(2 * 1024 * 1024)));
    const compressed = await doc.save();
    expect(compressed.length).toBeLessThan(20000);
    await expect(
      validatePdf(compressed, "application/pdf", "cv.pdf"),
    ).rejects.toThrow();
  });
  it("contains a cyclic page tree without hanging the request thread", async () => {
    const bytes = new TextEncoder().encode(
      "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [2 0 R] /Count 1 >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF",
    );
    const started = Date.now();
    await expect(
      validatePdf(bytes, "application/pdf", "cv.pdf"),
    ).rejects.toThrow();
    expect(Date.now() - started).toBeLessThan(4500);
  }, 6000);
});
