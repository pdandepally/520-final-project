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
import { api } from "@/utils/trpc/api";
import { toast } from "sonner";

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

  
  const { reset: resetSummary } = api.channels.summarizeChannel.useSubscription(
    { channelId },
    {
      onStarted: () => {
        setSummaryText("");
      },
      onData: (chunk) => {
        setSummaryText((prev) => prev + chunk);
      },
      onError: (error) => {
        toast.error(`Failed to generate summary: ${error.message}`);
      },
    }
  );

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
