import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="content-page wrap">
      <p className="eyebrow">404 / Off orbit</p>
      <h1 className="display">Let&apos;s get you back.</h1>
      <p>This page could not be found.</p>
      <Link className="button" href="/">
        Back to home
      </Link>
    </main>
  );
}
