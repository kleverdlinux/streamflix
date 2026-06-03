export default function SkeletonCard({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-full">
          <div className="skeleton w-full rounded-xl" style={{ aspectRatio: '2/3' }} />
          <div className="skeleton w-3/4 h-4 mt-2 rounded" />
          <div className="skeleton w-1/2 h-3 mt-1 rounded" />
        </div>
      ))}
    </>
  );
}
