import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { RotateCcw } from "lucide-react";

type ChannelSummaryProps = {
  open: boolean;
  setOpen: (isOpen: boolean) => void;
  channelId: string;
  children: React.ReactNode;
};

export default function ChannelSummary({
  open,
  setOpen,
  channelId,
  children,
}: ChannelSummaryProps) {
  const [summaryText, setSummaryText] = useState("");

  // [TODO]
  // Subscribe to the `summarizeChannel` API endpoint, supplying the channel ID
  // as input. Set the necessary handlers so that:
  // - On start, set the summary text to ""
  // - When a new chunk of data is supplied, concatenate it to the summary text.
  // - On an error, present a toast using `toast.error()`.
  // The subscription should produce a `resetSummary` function, which can be
  // achieved using:
  // `const { reset: resetSummary } = /* your API call here */`

  const resetButtonPressed = () => {
    setSummaryText("");
    resetSummary();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => setOpen(isOpen)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Channel Summary</DialogTitle>
          {summaryText.length > 0 ? (
            <p className="break-words whitespace-pre-wrap">{summaryText}</p>
          ) : (
            <div className="my-2 space-y-2">
              <Skeleton className="h-4 w-full px-8" />
              <Skeleton className="h-4 w-full px-8" />
              <Skeleton className="h-4 w-full px-8" />
              <Skeleton className="h-4 w-3/4 px-8" />
            </div>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button
            variant={"ghost"}
            disabled={summaryText.length === 0}
            onClick={resetButtonPressed}
          >
            <RotateCcw />
            Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
