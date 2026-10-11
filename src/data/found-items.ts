import type { FoundItem, LostItem } from "@/types/item";

export const foundItems: FoundItem[] = [
  {
    id: "silver-watch",
    name: "Silver wristwatch",
    category: "Accessories",
    description:
      "A silver-tone wristwatch with a dark blue face and a metal link band. It was turned in safely and is being kept with the venue's lost property team.",
    location: "Riverside Park, near the east entrance",
    foundDate: "2026-10-08",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1100&q=85",
    status: "Waiting for owner",
  },
  {
    id: "canvas-backpack",
    name: "Olive canvas backpack",
    category: "Bags & wallets",
    description:
      "A well-kept olive canvas daypack with leather-look trim. Found on a bench after the afternoon market and handed to the information desk.",
    location: "Old Town Market, information desk",
    foundDate: "2026-10-07",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1100&q=85",
    status: "Waiting for owner",
  },
  {
    id: "wireless-headphones",
    name: "Wireless headphones",
    category: "Electronics",
    description:
      "Over-ear wireless headphones in a matte charcoal finish. They were left in the quiet seating area and are now in secure care.",
    location: "Central Library, second floor",
    foundDate: "2026-10-06",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1100&q=85",
    status: "Waiting for owner",
  },
  {
    id: "black-sunglasses",
    name: "Black frame sunglasses",
    category: "Accessories",
    description:
      "Classic black frame sunglasses with dark lenses. Found near the garden path; identifying details are being kept private for verification.",
    location: "Botanical Gardens, north path",
    foundDate: "2026-10-05",
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1100&q=85",
    status: "Waiting for owner",
  },
  {
    id: "blue-sneakers",
    name: "Blue running shoes",
    category: "Clothing",
    description:
      "A pair of blue running shoes in a small drawstring bag. Left at the changing area and brought to the community centre reception.",
    location: "Harborview Sports Centre",
    foundDate: "2026-10-04",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1100&q=85",
    status: "Waiting for owner",
  },
  {
    id: "leather-wallet",
    name: "Brown leather wallet",
    category: "Bags & wallets",
    description:
      "A slim brown leather wallet. For the owner's privacy, contents and identifying marks are not shown here. Please include those details in a claim.",
    location: "Maple Street Café",
    foundDate: "2026-10-03",
    image:
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1100&q=85",
    status: "Reunited",
  },
  {
    id: "camera",
    name: "Compact digital camera",
    category: "Electronics",
    description:
      "A compact black digital camera found in the gallery courtyard. The memory card and any identifying details remain private.",
    location: "City Art Gallery, courtyard",
    foundDate: "2026-10-02",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1100&q=85",
    status: "Waiting for owner",
  },
  {
    id: "keyring",
    name: "Brass keyring with two keys",
    category: "Keys",
    description:
      "A small brass keyring with two keys and a plain green tag. Found near the main walkway and secured by the park office.",
    location: "Willow Creek Trail, main walkway",
    foundDate: "2026-10-01",
    image:
      "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=1100&q=85",
    status: "Waiting for owner",
  },
  {
    id: "cream-scarf",
    name: "Cream knit scarf",
    category: "Clothing",
    description:
      "A soft cream-coloured knit scarf, found folded beside the outdoor seating area. It has been handed in to the café team.",
    location: "Juniper Coffee, patio",
    foundDate: "2026-09-29",
    image:
      "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=1100&q=85",
    status: "Waiting for owner",
  },
];

export const lostItems: LostItem[] = [
  {
    id: "lost-green-bottle",
    name: "Green insulated water bottle",
    category: "Other",
    location: "Westside Community Pool",
    reportedDate: "2026-10-08",
  },
  {
    id: "lost-tote",
    name: "Striped canvas tote bag",
    category: "Bags & wallets",
    location: "Central Station",
    reportedDate: "2026-10-06",
  },
  {
    id: "lost-earbuds",
    name: "White wireless earbuds case",
    category: "Electronics",
    location: "Juniper Coffee",
    reportedDate: "2026-10-04",
  },
];
