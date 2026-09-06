import { AlertCircle, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Loading() {
  return (
    <output className="flex justify-center items-center gap-3 p-12 text-muted-foreground">
      <LoaderCircle className="size-5 animate-spin" />
      Loading…
    </output>
  );
}

export function Failure({ error, retry }: { error: Error; retry?: () => void }) {
  return (
    <div role="alert" className="my-6 rounded-xl border border-red-200 bg-red-50 p-6">
      <div className="flex gap-2 items-center font-medium">
        <AlertCircle className="size-5" />
        {error.message}
      </div>
      <div className="mt-3 flex gap-3">
        {retry && (
          <Button variant="outline" onClick={retry}>
            Try again
          </Button>
        )}
        <Button variant="outline" asChild>
          <a href="/api/login">Sign in</a>
        </Button>
      </div>
    </div>
  );
}
