import type { Metadata } from "next";
import { AdminOverview } from "@/components/admin/admin-overview";

export const metadata: Metadata = {
  title: "Overview | LostNFind Admin",
  description: "Review found-item reports and ownership claims in the LostNFind frontend prototype.",
};

export default function AdminOverviewPage() {
  return <AdminOverview />;
}
