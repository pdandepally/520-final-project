import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, style, ...props }: React.ComponentProps<"input">) {
  const forceStyles: React.CSSProperties = {
    backgroundColor: '#ffffff',
    color: '#000000',
    WebkitTextFillColor: '#000000',
    caretColor: '#000000',
    ...style
  };
  
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      style={forceStyles}
      {...props}
    />
  );
}

export { Input };
