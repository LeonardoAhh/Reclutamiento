import { Circle, CircleCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import "./ActivityDescription.css";

type DescriptionBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "bullet" | "checklist"; items: { text: string; done?: boolean }[] };

function parseDescription(description: string): DescriptionBlock[] {
  const blocks: DescriptionBlock[] = [];
  let afterBlankLine = true;

  for (const rawLine of description.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      afterBlankLine = true;
      continue;
    }

    const checklist = line.match(/^[-*]\s+\[([ xX])\]\s*(.*)$/);
    const bullet = checklist ? null : line.match(/^(?:•|[-*])\s+(.+)$/);
    if (checklist || bullet) {
      const kind = checklist ? "checklist" : "bullet";
      const item = checklist
        ? { text: checklist[2], done: checklist[1].toLowerCase() === "x" }
        : { text: bullet?.[1] ?? "" };
      const previous = blocks[blocks.length - 1];
      if (!afterBlankLine && previous && previous.kind !== "paragraph" && previous.kind === kind) previous.items.push(item);
      else blocks.push({ kind, items: [item] });
    } else {
      const previous = blocks[blocks.length - 1];
      if (!afterBlankLine && previous?.kind === "paragraph") previous.text += `\n${line}`;
      else if (!afterBlankLine && previous && previous.kind !== "paragraph") {
        const item = previous.items[previous.items.length - 1];
        if (item) item.text += `\n${line}`;
      } else blocks.push({ kind: "paragraph", text: line });
    }
    afterBlankLine = false;
  }

  return blocks;
}

export function ActivityDescription({ text, className = "" }: { text: string; className?: string }) {
  const { language } = useLanguage();
  const en = language === "en";

  return <div className={`activity-description ${className}`}>
    {parseDescription(text).map((block, blockIndex) => {
      if (block.kind === "paragraph") return <p key={blockIndex}>{block.text}</p>;
      if (block.kind === "bullet") return <ul key={blockIndex} className="activity-description__bullets">
        {block.items.map((item, itemIndex) => <li key={itemIndex}>{item.text}</li>)}
      </ul>;
      return <ul key={blockIndex} className="activity-description__checklist">
        {block.items.map((item, itemIndex) => <li key={itemIndex} data-completed={item.done || undefined}>
          {item.done
            ? <CircleCheck size="var(--icon-size-md)" aria-hidden="true" />
            : <Circle size="var(--icon-size-md)" aria-hidden="true" />}
          <span>
            <span className="sr-only">{item.done ? (en ? "Completed" : "Completada") : (en ? "Pending" : "Pendiente")}: </span>
            {item.text}
          </span>
        </li>)}
      </ul>;
    })}
  </div>;
}
