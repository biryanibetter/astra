/** The Cloudflare release serves the website only, not the prepared backend. */
export function websiteOnlyResponse(request: Request): Response | undefined {
  const pathname = decodeURIComponent(new URL(request.url).pathname);
  if (
    /^\/api(?:\/|$)/i.test(pathname) ||
    !["GET", "HEAD"].includes(request.method)
  ) {
    return Response.json(
      { message: "Live submissions are disabled." },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, private",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }
  return undefined;
}
