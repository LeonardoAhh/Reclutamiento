import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  FLOATING_SURFACE_COLLISION_PADDING,
  FLOATING_SURFACE_SIDE_OFFSET,
} from "@/lib/floatingSurface";
import { cn } from "@/lib/utils-shadcn";
import "./Popover.css";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(
  (
    {
      className,
      align = "center",
      sideOffset = FLOATING_SURFACE_SIDE_OFFSET,
      collisionPadding = FLOATING_SURFACE_COLLISION_PADDING,
      ...props
    },
    ref,
  ) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn("popover-content", className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  ),
);
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
