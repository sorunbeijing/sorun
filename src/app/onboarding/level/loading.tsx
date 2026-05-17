import { CardFormSkeleton } from "@/components/layout/skeletons";

export default function LevelLoading() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-md pt-4">
        <div className="mb-4 h-7 w-32 animate-pulse rounded-md bg-muted" />
        <CardFormSkeleton />
      </div>
    </div>
  );
}
