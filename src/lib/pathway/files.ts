import { join } from "node:path";
import { Worker } from "node:worker_threads";
import { MAX_CV_BYTES } from "./schema";

/** Structural validation is not malware certification. Never render CVs inline. */
export async function validatePdf(
  bytes: Uint8Array,
  type: string,
  name: string,
) {
  if (
    !bytes.length ||
    bytes.length > MAX_CV_BYTES ||
    type !== "application/pdf" ||
    !name.toLowerCase().endsWith(".pdf") ||
    !new TextDecoder()
      .decode(bytes.subarray(0, 8))
      .match(/^%PDF-1\.[0-7]|^%PDF-2\.0/u) ||
    !new TextDecoder().decode(bytes.subarray(-1024)).includes("%%EOF")
  ) {
    throw new Error("Use a PDF CV of at most 5 MB.");
  }
  // pdf-lib decompresses ObjStm/XRef streams before post-parse limits. Reject
  // these structures before the library runs, including hex-escaped PDF names.
  // Ordinary image/content streams are not inflated by this validation path.
  const lexical = new TextDecoder("latin1")
    .decode(bytes)
    .replace(/#([a-f0-9]{2})/giu, (_, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    );
  if (/\/(?:ObjStm|XRef)\b/u.test(lexical)) {
    throw new Error(
      "Print/export a flattened PDF without compressed object or cross-reference streams.",
    );
  }
  const worker = new Worker(
    join(process.cwd(), "scripts/pdf-validation-worker.mjs"),
    {
      workerData: bytes,
      execArgv: [],
      env: { NODE_OPTIONS: "" },
      resourceLimits: {
        maxOldGenerationSizeMb: 32,
        maxYoungGenerationSizeMb: 8,
        stackSizeMb: 1,
      },
    },
  );
  try {
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = (valid: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (valid) resolve();
        else
          reject(
            new Error(
              "This PDF is malformed, interactive, or exceeds the validation budget. Print/export a flattened PDF.",
            ),
          );
      };
      const timer = setTimeout(() => finish(false), 3000);
      worker.once("message", (valid: unknown) => finish(valid === true));
      worker.once("error", () => finish(false));
      worker.once("exit", () => finish(false));
    });
  } finally {
    await worker.terminate();
  }
}
