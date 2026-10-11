export const itemCategories = [
  "Electronics",
  "Bags & wallets",
  "Clothing",
  "Accessories",
  "Keys",
  "Documents",
  "Other",
] as const;

export type ItemCategory = (typeof itemCategories)[number];
export type ItemStatus = "Waiting for owner" | "Reunited";

export interface FoundItem {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  location: string;
  foundDate: string;
  image: string;
  status: ItemStatus;
}

export interface LostItem {
  id: string;
  name: string;
  category: ItemCategory;
  location: string;
  reportedDate: string;
}

export type AdminItemStatus = "Pending review" | "Approved" | "Rejected" | "Returned";
export type ClaimStatus = "Pending" | "Approved" | "Rejected";

export interface ReporterContact {
  name: string;
  email: string;
  phone: string;
}

export interface AdminFoundItem extends FoundItem {
  submittedAt: string;
  reviewStatus: AdminItemStatus;
  reporter: ReporterContact;
}

export interface ClaimRequest {
  id: string;
  itemId: string;
  claimant: ReporterContact;
  lostItemDescription: string;
  ownershipProof: string;
  supportingImage?: string;
  submittedAt: string;
  status: ClaimStatus;
}
