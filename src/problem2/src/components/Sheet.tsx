import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Close } from "./icons";

interface SheetProps {
  title: string;
  onClose: () => void;
  /** False while something must not be interrupted (a pending swap). */
  dismissible?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  /** Focus the first text field on open (search), instead of the dialog. */
  focusFirstInput?: boolean;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keeps Tab inside the dialog: Tab on the last element goes to the first,
 * Shift+Tab on the first goes to the last.
 */
function trapTab(event: KeyboardEvent, panel: HTMLElement) {
  const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Accessible modal: a centred dialog on desktop and a bottom sheet on phones.
 * Traps focus inside, closes on Escape or backdrop, locks page scroll, and
 * returns focus to whatever opened it.
 */
export function Sheet({
  title,
  onClose,
  dismissible = true,
  children,
  footer,
  focusFirstInput = false,
}: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // The effect below must run only once, when the dialog opens: running it
  // again would move focus back to the top. So it reads the latest onClose
  // and dismissible through refs instead of listing them as dependencies.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const dismissibleRef = useRef(dismissible);
  dismissibleRef.current = dismissible;

  useEffect(() => {
    // Remember what opened the dialog, to give focus back on close.
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current!;
    // Screen readers announce the dialog title when the panel takes focus.
    const first = focusFirstInput ? panel.querySelector<HTMLElement>("input") : null;
    (first ?? panel).focus();

    // Stop the page behind from scrolling, and hide it from keyboards and
    // screen readers (`inert`) while the dialog is open.
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const app = document.getElementById("root");
    if (app) app.inert = true;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dismissibleRef.current) {
        event.stopPropagation();
        onCloseRef.current();
      }
      if (event.key === "Tab") trapTab(event, panel);
    };
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = overflow;
      // Un-hide the page first: an inert element can't take focus back.
      if (app) app.inert = false;
      opener?.focus?.();
    };
  }, []); // once per open; see the note on the refs above

  return createPortal(
    <div
      className="sheet-backdrop"
      onMouseDown={(event) => {
        // Only a press that starts on the backdrop closes, not a drag from inside.
        if (event.target === event.currentTarget && dismissible) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        {/* Divs, not <header>/<footer>: inside a dialog those would read as
            a second page header and footer to screen readers. */}
        <div className="sheet__head">
          <h2 id={titleId}>{title}</h2>
          {dismissible && (
            <button
              type="button"
              className="icon-button"
              onClick={onClose}
              aria-label="Close"
            >
              <Close />
            </button>
          )}
        </div>
        <div className="sheet__body">{children}</div>
        {footer && <div className="sheet__foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
