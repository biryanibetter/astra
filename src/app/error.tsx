"use client";
export default function ErrorPage({ reset }: { readonly reset: () => void }) {
  return (
    <main id="main" className="content-page wrap">
      <p className="eyebrow gold">Something interrupted the connection</p>
      <h1 className="display">Try that again.</h1>
      <p>
        The page could not load. No application success is implied by this
        message.
      </p>
      <button type="button" className="button" onClick={reset}>
        Reload this page
      </button>
    </main>
  );
}
