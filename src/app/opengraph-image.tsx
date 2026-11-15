import { ImageResponse } from "next/og";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "ASTRA Youth Innovation Network: Built by students. Built for what's next.";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: "#000",
        color: "#fff",
        padding: 90,
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 24,
          color: "#C6CCD5",
          letterSpacing: 8,
          marginBottom: 50,
        }}
      >
        ASTRA / YOUTH INNOVATION NETWORK
      </div>
      <div style={{ fontSize: 76, fontWeight: 600, letterSpacing: -3 }}>
        Built by students.
      </div>
      <div
        style={{
          fontSize: 76,
          fontWeight: 600,
          letterSpacing: -3,
          color: "#F5F6F8",
        }}
      >
        Built for what&apos;s next.
      </div>
      <div style={{ fontSize: 24, color: "#8E9BAE", marginTop: 45 }}>
        Student-led. Qatar. Ages 13–18.
      </div>
    </div>,
    size,
  );
}
