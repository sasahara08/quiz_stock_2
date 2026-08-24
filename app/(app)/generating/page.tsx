import { Suspense } from "react";
import { GeneratingView } from "./generating-view";

export default async function GeneratingPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url = "" } = await searchParams;
  return (
    <Suspense fallback={<GeneratingFallback />}>
      <GeneratingView url={url} />
    </Suspense>
  );
}

function GeneratingFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
