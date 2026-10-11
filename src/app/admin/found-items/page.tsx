import type { Metadata } from "next";
import { AdminFoundItems } from "@/components/admin/admin-found-items";

export const metadata: Metadata = {
  title: "Found Items | LostNFind Admin",
  description: "Review and manage community found-item reports.",
};

export default function AdminFoundItemsPage() {
  return <AdminFoundItems />;
}
