import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, style, ...props }: React.ComponentProps<"textarea">) {
  const forceStyles: React.CSSProperties = {
    backgroundColor: '#ffffff',
    color: '#000000',
    WebkitTextFillColor: '#000000',
    caretColor: '#000000',
    ...style
  };
  
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-16 w-full rounded-md border px-3 py-2 text-base shadow-xs outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      style={forceStyles}
      {...props}
    />
  );
}

export { Textarea };
