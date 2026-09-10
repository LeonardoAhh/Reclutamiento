import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils-shadcn";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import "./TruncatedTextPopover.css";

interface TruncatedTextPopoverProps {
  text: string;
  className?: string;
}

export function TruncatedTextPopover({
  text,
  className,
}: TruncatedTextPopoverProps) {
  const previewRef = useRef<HTMLParagraphElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;

    const measureOverflow = () => {
      setIsOverflowing(preview.scrollHeight > preview.clientHeight);
    };

    measureOverflow();
    const observer = new ResizeObserver(measureOverflow);
    observer.observe(preview);
    return () => observer.disconnect();
  }, [text]);

  return (
    <Popover>
      <div className="truncated-text-popover">
        <p
          ref={previewRef}
          className={cn("truncated-text-popover__preview", className)}
        >
          {text}
        </p>

        {isOverflowing && (
          <PopoverTrigger asChild>
            <button type="button" className="btn-text">
              Ver más
            </button>
          </PopoverTrigger>
        )}
      </div>

      {isOverflowing && (
        <PopoverContent
          align="start"
          className="truncated-text-popover__content"
        >
          <p>{text}</p>
        </PopoverContent>
      )}
    </Popover>
  );
}
