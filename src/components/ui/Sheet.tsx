import * as SheetPrimitive from "@radix-ui/react-dialog";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ComponentRef } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils-shadcn";
import "./Sheet.css";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;

const SheetContent = forwardRef<
  ComponentRef<typeof SheetPrimitive.Content>,
  ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & {
    variant?: "edge" | "floating";
  }
>(({ className, children, variant = "edge", ...props }, ref) => (
  <SheetPrimitive.Portal>
    <SheetPrimitive.Overlay className="sheet-overlay" />
    <SheetPrimitive.Content
      ref={ref}
      className={cn("sheet-content", `sheet-content--${variant}`, className)}
      {...props}
    >
      {children}
    </SheetPrimitive.Content>
  </SheetPrimitive.Portal>
));
SheetContent.displayName = "SheetContent";

const SheetHeader = forwardRef<
  HTMLElement,
  ComponentPropsWithoutRef<"header"> & {
    hideCloseButton?: boolean;
    closeLabel?: string;
  }
>(({ className, children, hideCloseButton = false, closeLabel, ...props }, ref) => {
  const { language } = useLanguage();

  return (
    <header ref={ref} className={cn("sheet-header", className)} {...props}>
      <div className="sheet-heading">{children}</div>
      {!hideCloseButton && <SheetClose
        type="button"
        className="sheet-close"
        aria-label={closeLabel ?? (language === "en" ? "Close" : "Cerrar")}
      >
        <X aria-hidden="true" />
      </SheetClose>}
    </header>
  );
});
SheetHeader.displayName = "SheetHeader";

const SheetTitle = forwardRef<
  ComponentRef<typeof SheetPrimitive.Title>,
  ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("sheet-title", className)}
    {...props}
  />
));
SheetTitle.displayName = "SheetTitle";

const SheetDescription = forwardRef<
  ComponentRef<typeof SheetPrimitive.Description>,
  ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("sheet-description", className)}
    {...props}
  />
));
SheetDescription.displayName = "SheetDescription";

const SheetBody = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("sheet-body", className)} {...props} />
  ),
);
SheetBody.displayName = "SheetBody";

const SheetFooter = forwardRef<HTMLElement, ComponentPropsWithoutRef<"footer">>(
  ({ className, ...props }, ref) => (
    <footer ref={ref} className={cn("sheet-footer", className)} {...props} />
  ),
);
SheetFooter.displayName = "SheetFooter";

export {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
};
