import Image from "next/image";
import type { FoundItem } from "@/types/item";
import { formatDate } from "@/lib/format";
import { Icon } from "@/components/ui/icon";

interface ItemCardProps {
  item: FoundItem;
  onSelect: (item: FoundItem) => void;
}

export function ItemCard({ item, onSelect }: ItemCardProps) {
  return (
    <button
      aria-label={`View details for ${item.name}`}
      className="item-card"
      onClick={() => onSelect(item)}
      type="button"
    >
      <div className="item-image-wrap">
        <Image
          alt={item.name}
          className="item-image"
          fill
          sizes="(max-width: 620px) 100vw, (max-width: 840px) 50vw, 33vw"
          src={item.image}
          unoptimized
        />
        <span className="item-status">
          <span className="item-status-dot" />
          {item.status}
        </span>
      </div>
      <div className="item-card-body">
        <div className="item-card-topline">
          <h3 className="item-card-title">{item.name}</h3>
          <span className="item-category">{item.category}</span>
        </div>
        <div className="item-card-meta">
          <span className="item-card-meta-line"><Icon name="pin" />{item.location}</span>
          <span className="item-card-meta-line"><Icon name="calendar" />Found {formatDate(item.foundDate)}</span>
        </div>
      </div>
    </button>
  );
}
