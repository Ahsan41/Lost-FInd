import type { Metadata } from "next";
import { FoundItemsBrowser } from "@/components/routes/found-items-browser";

export const metadata: Metadata = {
  title: "Found items | LostNFind",
  description: "Browse recently found belongings in your community.",
};

interface FoundItemsPageProps {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
  }>;
}

export default async function FoundItemsPage({ searchParams }: FoundItemsPageProps) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "";
  return <FoundItemsBrowser initialQuery={query} initialCategory={category} />;
}
