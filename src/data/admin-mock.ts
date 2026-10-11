import { foundItems } from "@/data/found-items";
import type { AdminFoundItem, ClaimRequest, ReporterContact } from "@/types/item";

const itemReports: Record<
  string,
  { submittedAt: string; reviewStatus: AdminFoundItem["reviewStatus"]; reporter: ReporterContact }
> = {
  "silver-watch": {
    submittedAt: "2026-10-08",
    reviewStatus: "Approved",
    reporter: { name: "Morgan Ellis", email: "morgan@example.com", phone: "+1 202-555-0101" },
  },
  "canvas-backpack": {
    submittedAt: "2026-10-07",
    reviewStatus: "Approved",
    reporter: { name: "Jamie Brooks", email: "jamie@example.com", phone: "+1 202-555-0102" },
  },
  "wireless-headphones": {
    submittedAt: "2026-10-06",
    reviewStatus: "Approved",
    reporter: { name: "Taylor Morgan", email: "taylor@example.com", phone: "+1 202-555-0103" },
  },
  "black-sunglasses": {
    submittedAt: "2026-10-05",
    reviewStatus: "Approved",
    reporter: { name: "Riley Parker", email: "riley@example.com", phone: "+1 202-555-0104" },
  },
  "blue-sneakers": {
    submittedAt: "2026-10-04",
    reviewStatus: "Approved",
    reporter: { name: "Casey Lane", email: "casey@example.com", phone: "+1 202-555-0105" },
  },
  "leather-wallet": {
    submittedAt: "2026-10-03",
    reviewStatus: "Returned",
    reporter: { name: "Alex Rivera", email: "alex@example.com", phone: "+1 202-555-0106" },
  },
  camera: {
    submittedAt: "2026-10-02",
    reviewStatus: "Approved",
    reporter: { name: "Jordan Lee", email: "jordan@example.com", phone: "+1 202-555-0107" },
  },
  keyring: {
    submittedAt: "2026-10-01",
    reviewStatus: "Approved",
    reporter: { name: "Sam Ellis", email: "sam@example.com", phone: "+1 202-555-0108" },
  },
  "cream-scarf": {
    submittedAt: "2026-09-29",
    reviewStatus: "Approved",
    reporter: { name: "Avery Reed", email: "avery@example.com", phone: "+1 202-555-0109" },
  },
};

export const adminFoundItems: AdminFoundItem[] = foundItems.map((item) => ({
  ...item,
  ...(itemReports[item.id] ?? {
    submittedAt: item.foundDate,
    reviewStatus: "Pending review" as const,
    reporter: { name: "Community member", email: "member@example.com", phone: "+1 202-555-0199" },
  }),
  ...(item.id === "leather-wallet" ? { status: "Reunited" as const } : {}),
}));

adminFoundItems.push(
  {
    id: "fringed-scarf-review",
    name: "Cream scarf with fringe",
    category: "Clothing",
    description: "A cream-coloured knit scarf found beside the transit shelter and handed in for review.",
    location: "Juniper Avenue transit shelter",
    foundDate: "2026-10-10",
    image: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=1100&q=85",
    status: "Waiting for owner",
    submittedAt: "2026-10-10",
    reviewStatus: "Pending review",
    reporter: { name: "Chris Taylor", email: "chris@example.com", phone: "+1 202-555-0110" },
  },
  {
    id: "canvas-tote-review",
    name: "Canvas tote bag",
    category: "Bags & wallets",
    description: "A canvas tote bag with a small stitched front pocket, found near the north entrance.",
    location: "Northside Community Hall",
    foundDate: "2026-09-27",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1100&q=85",
    status: "Waiting for owner",
    submittedAt: "2026-09-27",
    reviewStatus: "Rejected",
    reporter: { name: "Drew Morgan", email: "drew@example.com", phone: "+1 202-555-0111" },
  },
);

export const claimRequests: ClaimRequest[] = [
  {
    id: "claim-watch-01",
    itemId: "silver-watch",
    claimant: { name: "Robin Harper", email: "robin@example.com", phone: "+1 202-555-0121" },
    lostItemDescription: "A silver watch with a navy dial and a small scratch near the clasp.",
    ownershipProof: "The initials R.H. are engraved on the inside of the clasp; there is also a tiny star mark by the 6.",
    submittedAt: "2026-10-09",
    status: "Pending",
  },
  {
    id: "claim-bag-02",
    itemId: "canvas-backpack",
    claimant: { name: "Devon Price", email: "devon@example.com", phone: "+1 202-555-0122" },
    lostItemDescription: "An olive canvas backpack with a small notebook in the front pocket.",
    ownershipProof: "The left strap has a hand-stitched repair in dark green thread, and a brass compass is clipped inside.",
    submittedAt: "2026-10-08",
    status: "Pending",
  },
  {
    id: "claim-keys-03",
    itemId: "keyring",
    claimant: { name: "Emery Clark", email: "emery@example.com", phone: "+1 202-555-0123" },
    lostItemDescription: "Two keys on a brass ring with a plain green tag.",
    ownershipProof: "One key has three shallow notches along its side. The tag has a handwritten number on the back.",
    submittedAt: "2026-10-06",
    status: "Approved",
  },
  {
    id: "claim-camera-04",
    itemId: "camera",
    claimant: { name: "Skyler Quinn", email: "skyler@example.com", phone: "+1 202-555-0124" },
    lostItemDescription: "A compact camera with a black case.",
    ownershipProof: "I can share the serial number and describe the strap attached to the case.",
    submittedAt: "2026-10-04",
    status: "Rejected",
  },
];
