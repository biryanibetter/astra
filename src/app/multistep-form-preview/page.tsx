import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import OnboardingForm from "@/components/ui/multistep-form";
import "./preview.css";

export default function MultistepFormPreview() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <main id="main" className="multistep-form-preview">
      <OnboardingForm />
      <Toaster />
    </main>
  );
}
