import { parentPort, workerData } from "node:worker_threads";
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFRawStream } from "pdf-lib";

const prohibited = new Set(["JavaScript", "JS", "OpenAction", "AA", "Launch",
  "EmbeddedFile", "EmbeddedFiles", "RichMedia", "XFA", "AcroForm"]);
try {
  const doc = await PDFDocument.load(workerData, {
    ignoreEncryption: false, throwOnInvalidObject: true, updateMetadata: false,
  });
  const objects = doc.context.enumerateIndirectObjects();
  if (doc.isEncrypted || objects.length > 10000 || doc.getPageCount() < 1 || doc.getPageCount() > 50) throw new Error();
  let budget = 50000;
  function visit(object, depth = 0) {
    if (--budget < 0 || depth > 40) throw new Error();
    if (object instanceof PDFName && prohibited.has(object.decodeText())) throw new Error();
    if (object instanceof PDFRawStream) visit(object.dict, depth + 1);
    else if (object instanceof PDFDict) {
      for (const [key, value] of object.entries()) { visit(key, depth + 1); visit(value, depth + 1); }
    } else if (object instanceof PDFArray) {
      for (const value of object.asArray()) visit(value, depth + 1);
    }
  }
  for (const [, object] of objects) visit(object);
  parentPort.postMessage(true);
} catch { parentPort.postMessage(false); }
