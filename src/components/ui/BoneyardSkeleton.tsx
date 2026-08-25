import type { ReactNode } from "react";
import {
  Skeleton as BoneyardPrimitive,
  type SkeletonProps as BoneyardPrimitiveProps,
} from "boneyard-js/react";
import "./BoneyardSkeleton.css";

interface BoneyardSkeletonProps
  extends Pick<
    BoneyardPrimitiveProps,
    "fixture" | "snapshotConfig" | "className"
  > {
  name: string;
  loading: boolean;
  loadingLabel: string;
  children: ReactNode;
}

/** Centraliza tokens, responsive, reduced motion y anuncio de carga. */
export function BoneyardSkeleton({
  name,
  loading,
  loadingLabel,
  children,
  fixture,
  snapshotConfig,
  className,
}: BoneyardSkeletonProps) {
  return (
    <>
      <BoneyardPrimitive
        name={name}
        loading={loading}
        fixture={fixture}
        snapshotConfig={snapshotConfig}
        className={className}
        select="viewport"
      >
        {children}
      </BoneyardPrimitive>
      {loading && (
        <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {loadingLabel}
        </span>
      )}
    </>
  );
}
