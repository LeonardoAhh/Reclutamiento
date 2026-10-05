import * as React from "react";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import {
  FLOATING_SURFACE_COLLISION_PADDING,
  FLOATING_SURFACE_SIDE_OFFSET,
} from "@/lib/floatingSurface";
import { cn } from "@/lib/utils-shadcn";
import "./HoverCard.css";

const HoverCard = HoverCardPrimitive.Root;
const HoverCardTrigger = HoverCardPrimitive.Trigger;

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
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
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn("hover-card-content", className)}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  ),
);
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

export { HoverCard, HoverCardContent, HoverCardTrigger };
