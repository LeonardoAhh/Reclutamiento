import { createPortal } from "react-dom";
import { useLayoutEffect, useState, type ComponentPropsWithRef, type ReactNode } from "react";

function useHeaderTitleTarget() {
  const [target, setTarget] = useState<HTMLElement | null | undefined>(undefined);

  useLayoutEffect(() => {
    setTarget(document.getElementById("app-header-title"));
  }, []);

  return target;
}

export function PageHeading(props: ComponentPropsWithRef<"h1">) {
  const target = useHeaderTitleTarget();
  if (target === undefined) return null;
  const heading = <h1 {...props} />;

  return target ? createPortal(heading, target) : heading;
}

export function PageHeaderAccessory({ children }: { children: ReactNode }) {
  const target = useHeaderTitleTarget();
  if (target === undefined) return null;
  const accessory = <div className="app-header__title-accessory">{children}</div>;
  return target ? createPortal(accessory, target) : accessory;
}
