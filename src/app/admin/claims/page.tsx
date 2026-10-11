import type { Metadata } from "next";
import { AdminClaims } from "@/components/admin/admin-claims";

export const metadata: Metadata = {
  title: "Claims | LostNFind Admin",
  description: "Review ownership claims for found items.",
};

export default function AdminClaimsPage() {
  return <AdminClaims />;
}
