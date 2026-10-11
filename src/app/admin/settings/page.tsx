import type { Metadata } from "next";
import { AdminSettings } from "@/components/admin/admin-settings";

export const metadata: Metadata = {
  title: "Settings | LostNFind Admin",
  description: "Preview workspace notification preferences.",
};

export default function AdminSettingsPage() {
  return <AdminSettings />;
}
