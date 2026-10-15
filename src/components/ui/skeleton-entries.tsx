interface SkeletonEntriesProps {
  count?: number;
  variant: "tile" | "row";
}

/** Placeholder entries shown while the register loads. Always `aria-hidden`; pair with a visible or sr-only status message. */
export function SkeletonEntries({ count = 3, variant }: SkeletonEntriesProps) {
  const items = Array.from({ length: count }, (_, index) => index);
  if (variant === "tile") {
    return (
      <div aria-hidden="true" className="tile-grid">
        {items.map((index) => (
          <div className="skeleton-entry" key={index}>
            <div className="skeleton skeleton-media-tile" />
            <div className="skeleton-lines">
              <div className="skeleton skeleton-line skeleton-line-short" />
              <div className="skeleton skeleton-line skeleton-line-title" />
              <div className="skeleton skeleton-line" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div aria-hidden="true" className="ledger">
      {items.map((index) => (
        <div className="skeleton-entry skeleton-entry-row" key={index}>
          <div className="skeleton skeleton-media-row" />
          <div className="skeleton-lines">
            <div className="skeleton skeleton-line skeleton-line-short" />
            <div className="skeleton skeleton-line skeleton-line-title" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line skeleton-line-short" />
          </div>
        </div>
      ))}
    </div>
  );
}
