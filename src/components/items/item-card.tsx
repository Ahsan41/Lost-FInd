import Image from "next/image";
import type { FoundItem } from "@/types/item";
import { formatDate } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import { StatusTag } from "@/components/ui/status-tag";

interface ItemCardProps {
  item: FoundItem;
  onSelect: (item: FoundItem) => void;
  /** `tile` is image-led for short, featured lists; `row` is the compact ledger entry used in the register. */
  variant?: "tile" | "row";
}

export function ItemCard({ item, onSelect, variant = "tile" }: ItemCardProps) {
  const row = variant === "row";
  return (
    <button
      aria-label={`View details for ${item.name}`}
      className={`entry entry-${variant}`}
      onClick={() => onSelect(item)}
      type="button"
    >
      <span className="entry-media">
        {item.image ? (
          <Image
            alt=""
            fill
            sizes={row ? "112px" : "(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw"}
            src={item.image}
            unoptimized
          />
        ) : (
          <span className="item-image-placeholder"><Icon name="image" />No photo</span>
        )}
      </span>
      <span className="entry-body">
        <span className="entry-meta">
          <span className="entry-category">{item.category}</span>
          <time dateTime={item.foundDate}>Found {formatDate(item.foundDate)}</time>
        </span>
        <span aria-level={3} className="entry-title" role="heading">{item.name}</span>
        <span className="entry-location"><Icon name="pin" />{item.location}</span>
        {row && <span className="entry-description">{item.description}</span>}
        <span className="entry-foot">
          <StatusTag status={item.status} />
          <span className="entry-open-hint">Open entry</span>
        </span>
      </span>
    </button>
  );
}
