/** Server/Client 均可用的骨架屏（无 hooks） */

function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

export function PageShellSkeleton({ title = "加载中" }: { title?: string }) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="space-y-2">
            <Block className="h-3 w-16" />
            <Block className="h-5 w-24" />
            <p className="sr-only">{title}</p>
          </div>
          <div className="flex gap-2">
            <Block className="h-9 w-9 rounded-md" />
            <Block className="h-9 w-9 rounded-md" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-4">
        <LessonListSkeleton count={3} />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background">
        <div className="mx-auto flex max-w-3xl justify-around py-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Block key={i} className="h-8 w-10" />
          ))}
        </div>
      </nav>
    </div>
  );
}

export function LessonListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-lg border p-4">
          <Block className="h-5 w-3/4" />
          <Block className="h-4 w-1/2" />
          <Block className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Block className="h-4 w-20" />
        <div className="rounded-lg border p-4">
          <Block className="mb-2 h-5 w-28" />
          <Block className="h-4 w-full" />
        </div>
      </div>
      <div className="space-y-3">
        <Block className="h-4 w-24" />
        <LessonListSkeleton count={2} />
      </div>
      <div className="space-y-3">
        <Block className="h-4 w-24" />
        <LessonListSkeleton count={3} />
      </div>
    </div>
  );
}

export function CardFormSkeleton() {
  return (
    <div className="space-y-4 rounded-lg border p-6">
      <Block className="h-6 w-32" />
      <Block className="h-4 w-full" />
      <Block className="h-10 w-full" />
      <Block className="h-10 w-full" />
      <Block className="h-10 w-full" />
    </div>
  );
}
