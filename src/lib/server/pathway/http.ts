import "server-only";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function reply(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
      ...(status === 429 ? { "Retry-After": "3600" } : {}),
    },
  });
}
export function assertOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.SITE_URL
    ? new URL(process.env.SITE_URL).origin
    : new URL(request.url).origin;
  if (
    !origin ||
    origin !== expected ||
    origin !== new URL(request.url).origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    throw new HttpError(403, "This request is not allowed.");
  }
}
export async function readBytes(request: Request, maximum: number) {
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/u.test(declared) || Number(declared) > maximum)) {
    throw new HttpError(413, "The request is too large.");
  }
  if (!request.body) throw new HttpError(400, "The request is missing.");
  const reader = request.body.getReader();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const chunks: Uint8Array[] = [];
  let size = 0;
  const read = async () => {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      size += result.value.length;
      if (size > maximum) throw new HttpError(413, "The request is too large.");
      chunks.push(result.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return bytes;
  };
  try {
    return await Promise.race([
      read(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          void reader.cancel().catch(() => {});
          reject(new HttpError(408, "The request timed out. Please retry."));
        }, 15000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => {});
  }
}
export async function readJson(request: Request) {
  if (
    request.headers.get("content-type")?.split(";")[0]?.trim() !==
    "application/json"
  ) {
    throw new HttpError(415, "Send JSON.");
  }
  try {
    return JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(
        await readBytes(request, 32768),
      ),
    ) as unknown;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "The request could not be read.");
  }
}
export function route(handler: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (error) {
      return reply(
        {
          message:
            error instanceof HttpError
              ? error.message
              : "Temporarily unavailable. Your answers have not been cleared. Please retry.",
        },
        error instanceof HttpError ? error.status : 503,
      );
    }
  };
}
