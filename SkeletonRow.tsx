const SkeletonRow = () => (
  <section className="py-4">
    <div className="h-6 w-40 bg-muted rounded mb-3 mx-4 sm:mx-6 animate-pulse" />
    <div className="flex gap-3 px-4 sm:px-6 overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[160px] sm:w-[200px]">
          <div className="aspect-[2/3] rounded-md bg-muted animate-pulse" />
          <div className="h-4 w-3/4 bg-muted rounded mt-2 animate-pulse" />
        </div>
      ))}
    </div>
  </section>
);

export default SkeletonRow;
