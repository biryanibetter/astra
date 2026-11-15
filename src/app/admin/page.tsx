import { redirect } from "next/navigation";
import { AdminReview } from "@/components/admin-review";
import { administrator } from "@/lib/server/pathway/auth";
import { HttpError } from "@/lib/server/pathway/http";
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  try {
    const user = await administrator();
    return <AdminReview owner={user.role === "admin"} />;
  } catch (error) {
    if (error instanceof HttpError && error.status === 401)
      redirect("/admin/login");
    return (
      <main style={{ padding: "140px 24px" }}>
        <h1>Review access unavailable</h1>
        <p>Authorized access and service configuration are required.</p>
      </main>
    );
  }
}
