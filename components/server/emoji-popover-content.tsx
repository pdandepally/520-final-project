import { PopoverContent } from "../ui/popover";
import { EMOJI_CATEGORIES, EMOJIS_BY_CATEGORY } from "@/utils/emoji/emoji-list";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";

type EmojiPopoverContentProps = { onSelect: (emoji: string) => void };
export default function EmojiPopoverContent({
  onSelect,
}: EmojiPopoverContentProps) {
  return (
    <PopoverContent className="bg-sidebar w-[248px]">
      <ScrollArea className="h-[320px] w-[220px]">
        {EMOJI_CATEGORIES.map((category) => (
          <div key={category}>
            <p className="py-2 text-sm font-semibold">{category}</p>
            <div className="flex w-full flex-row flex-wrap gap-2 py-2">
              {EMOJIS_BY_CATEGORY[category].map((emoji, emojiIndex) => (
                <Button
                  key={`${category}-${emojiIndex}`}
                  variant="ghost"
                  size="icon"
                  onClick={() => onSelect(emoji)}
                >
                  <p className="text-lg">{emoji}</p>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </ScrollArea>
    </PopoverContent>
  );
}
