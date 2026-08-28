import { useRef, useEffect } from "react";
import { List, ListTodo } from "lucide-react";

export function SmartTextarea({
  id,
  value,
  onChange,
  placeholder,
  maxLength = 1500,
}: {
  id: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleResize = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  useEffect(() => {
    handleResize();
  }, [value]);

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    let prefix = "";
    if (start > 0 && value[start - 1] !== "\n") {
      prefix = "\n";
    }

    const insertion = prefix + text;
    const newValue =
      value.substring(0, start) + insertion + value.substring(end);
    onChange(newValue);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + insertion.length, start + insertion.length);
    }, 0);
  };

  return (
    <div className="smart-textarea-wrapper">
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={3}
        className="smart-textarea"
      />
      <div className="smart-textarea-toolbar">
        <div className="smart-textarea-actions">
          <button
            type="button"
            className="smart-textarea-btn"
            onClick={() => insertAtCursor("• ")}
            title="Añadir viñeta"
          >
            <List size="var(--icon-size-sm)" aria-hidden="true" />
            <span>Viñeta</span>
          </button>
          <button
            type="button"
            className="smart-textarea-btn"
            onClick={() => insertAtCursor("- [ ] ")}
            title="Añadir checklist"
          >
            <ListTodo size="var(--icon-size-sm)" aria-hidden="true" />
            <span>Checklist</span>
          </button>
        </div>
        <span className="smart-textarea-counter">
          {value.length} / {maxLength}
        </span>
      </div>
    </div>
  );
}
