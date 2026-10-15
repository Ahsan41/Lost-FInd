import type { Metadata } from "next";
import { AdminAnalytics } from "@/components/admin/admin-analytics";

export const metadata: Metadata = {
  title: "Analytics | LostNFind Admin",
  description: "Charts drawn from the register's reports and claims.",
};

export default function AdminAnalyticsPage() {
  return <AdminAnalytics />;
}
