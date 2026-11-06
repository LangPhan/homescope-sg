export function ListingCardSkeleton() {
  return <div className="listing-card listing-skeleton" aria-hidden="true">
    <div className="listing-image-wrap skeleton-block" />
    <div className="skeleton-body">
      <div className="skeleton-block skeleton-line skeleton-line-short" />
      <div className="skeleton-block skeleton-line skeleton-line-title" />
      <div className="skeleton-block skeleton-line" />
      <div className="skeleton-block skeleton-line skeleton-line-short" />
    </div>
  </div>;
}
