import { notFound } from "next/navigation";
import { SterlingGateKineticNavigation } from "@/components/ui/sterling-gate-kinetic-navigation";
import "./preview.css";

export default function SterlingPreview() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <main id="main" className="sterling-reference-preview">
      <div className="sterling-preview-header">
        <SterlingGateKineticNavigation reference />
      </div>
    </main>
  );
}
