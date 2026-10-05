import { useId, useRef, useState, type ReactNode } from "react";
import { Check, Info } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/HoverCard";
import { FLOATING_SURFACE_HOVER_CLOSE_DELAY_MS } from "@/lib/floatingSurface";
import type { HomeLessonData } from "../homeContent";
import "./HomeLessonCard.css";

type HomeLessonCardProps = HomeLessonData & {
  action?: ReactNode;
  children?: ReactNode;
};

export function HomeLessonCard({
  title,
  description,
  eyebrow,
  icon: Icon,
  practices,
  steps,
  action,
  children,
}: HomeLessonCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const contentId = useId();
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <HoverCard
      open={isOpen}
      onOpenChange={setIsOpen}
      openDelay={200}
      closeDelay={FLOATING_SURFACE_HOVER_CLOSE_DELAY_MS}
    >
      <article
        className={`home-page__lesson${action ? " home-page__lesson--has-action" : ""}`}
      >
        <div className="home-page__lesson-body">
          <Icon className="home-page__lesson-icon" aria-hidden="true" />
          <div className="home-page__lesson-copy">
            {eyebrow && <span className="home-page__eyebrow">{eyebrow}</span>}
            <h3 id={titleId} className="home-page__lesson-title">{title}</h3>
            {description && (
              <p id={`${titleId}-description`} className="home-page__lesson-description">
                {description}
              </p>
            )}
          </div>
          <Info className="home-page__lesson-info-icon" aria-hidden="true" />
        </div>
        <HoverCardTrigger asChild>
          <button
            type="button"
            className="home-page__lesson-trigger"
            aria-labelledby={titleId}
            aria-describedby={[
              description ? `${titleId}-description` : "",
              isOpen ? contentId : "",
            ].filter(Boolean).join(" ") || undefined}
            aria-expanded={isOpen}
            aria-controls={isOpen ? contentId : undefined}
            onPointerDown={event => {
              if (event.pointerType === "touch") setIsOpen(true);
            }}
            onClick={() => setIsOpen(true)}
            onKeyDown={event => {
              const content = contentRef.current;
              if (!isOpen || !content || content.scrollHeight <= content.clientHeight) return;

              const page = content.clientHeight;
              const step = page / 3;
              const distances: Record<string, number> = {
                ArrowDown: step,
                ArrowUp: -step,
                PageDown: page,
                PageUp: -page,
              };
              if (event.key === "Home" || event.key === "End") {
                event.preventDefault();
                content.scrollTo({ top: event.key === "Home" ? 0 : content.scrollHeight });
              } else if (event.key in distances) {
                event.preventDefault();
                content.scrollBy({ top: distances[event.key] });
              }
            }}
          />
        </HoverCardTrigger>
        {action && <div className="home-page__lesson-action">{action}</div>}
      </article>
      <HoverCardContent
        ref={contentRef}
        id={contentId}
        className="home-page__lesson-content"
        side="bottom"
        align="start"
        sticky="always"
        aria-labelledby={titleId}
      >
        {practices && (
          <ul className="home-page__check-list">
            {practices.map(practice => (
              <li key={practice}>
                <Check aria-hidden="true" />
                <span>{practice}</span>
              </li>
            ))}
          </ul>
        )}
        {steps && (
          <ol>{steps.map(step => <li key={step}>{step}</li>)}</ol>
        )}
        {children}
      </HoverCardContent>
    </HoverCard>
  );
}
