import { useState } from "react";
import { Tooltip } from "radix-ui";

export function CalendarBlockLabel({ title, description }: { title: string; description: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root open={open} onOpenChange={setOpen}>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            className="pointer-events-auto relative z-2 block w-full truncate px-2 py-1 text-left text-xs italic text-foreground/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            onMouseDownCapture={(event) => event.stopPropagation()}
            onTouchStartCapture={(event) => event.stopPropagation()}
            onClick={(event) => {
              // Keep click/tap useful too; the default tooltip click handler closes it.
              event.preventDefault();
              setOpen(true);
            }}
          >
            {title}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={6}
            collisionPadding={12}
            className="z-50 max-w-[min(24rem,calc(100vw-2rem))] whitespace-pre-line wrap-anywhere rounded-md border bg-popover px-4 py-3 text-sm leading-relaxed text-popover-foreground shadow-md"
          >
            {description}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
