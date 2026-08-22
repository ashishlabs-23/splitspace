"use client";

/**
 * Command Palette
 * ───────────────
 * Opens with ⌘K / Ctrl+K. Provides fuzzy search over:
 *   - Quick actions  (Add expense, Create space, Invite, Sign out)
 *   - Your spaces    (switch instantly)
 *   - Recent expenses (read-only, for reference)
 *
 * Keyboard navigation:
 *   ↑/↓          move highlight
 *   Enter        activate item
 *   Escape       close
 *
 * Built with motion/react + the Overlay primitive (focus trap, scroll lock).
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
import {
  LogOut,
  Plus,
  Receipt,
  Search,
  Users,
  Zap,
  Command,
  ArrowRight,
} from "lucide-react";
import { useScrollLock, useFocusTrap } from "@/components/ui/overlay";

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
export interface CmdAction {
  id: string;
  label: string;
  description?: string;
  icon: ReactNode;
  group: string;
  keywords?: string;
  onSelect: () => void;
  danger?: boolean;
}

/* ─────────────────────────────────────────────────────────────
   Fuzzy match — scores how well query matches label/keywords
───────────────────────────────────────────────────────────── */
function fuzzy(query: string, target: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return true;
  // char-by-char fuzzy
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

/* ─────────────────────────────────────────────────────────────
   CommandPalette component
───────────────────────────────────────────────────────────── */
interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  actions: CmdAction[];
}

export function CommandPalette({ open, onClose, actions }: CommandPaletteProps) {
  const [query, setQuery]       = useState("");
  const [cursor, setCursor]     = useState(0);
  const inputRef                = useRef<HTMLInputElement>(null);
  const listRef                 = useRef<HTMLUListElement>(null);
  const containerRef            = useRef<HTMLDivElement>(null);

  useScrollLock(open);
  useFocusTrap(containerRef, open);

  /* Reset on open */
  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  /* Filtered + grouped results */
  const filtered = useMemo(() => {
    return actions.filter(a =>
      fuzzy(query, a.label + " " + (a.keywords ?? "") + " " + (a.description ?? ""))
    );
  }, [query, actions]);

  /* Group the results */
  const grouped = useMemo(() => {
    const map = new Map<string, CmdAction[]>();
    for (const a of filtered) {
      if (!map.has(a.group)) map.set(a.group, []);
      map.get(a.group)!.push(a);
    }
    return map;
  }, [filtered]);

  /* Flat list for keyboard navigation */
  const flat = useMemo(() => filtered, [filtered]);

  /* Clamp cursor */
  useEffect(() => {
    setCursor(c => Math.min(c, Math.max(0, flat.length - 1)));
  }, [flat.length]);

  /* Scroll active item into view */
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-cmd-idx="${cursor}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const activate = useCallback((idx: number) => {
    flat[idx]?.onSelect();
    onClose();
  }, [flat, onClose]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor(c => (c + 1) % Math.max(1, flat.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor(c => (c - 1 + flat.length) % Math.max(1, flat.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      activate(cursor);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  /* Escape key handler (global) */
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h, true);
    return () => document.removeEventListener("keydown", h, true);
  }, [open, onClose]);

  /* Flat index counter across groups for data-cmd-idx */
  let flatIdx = 0;

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(5,9,18,0.78)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              zIndex: 9000,
            }}
          />

          {/* Panel */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              padding: "14vh 16px 16px",
              zIndex: 9001,
              pointerEvents: "none",
            }}
          >
            <motion.div
              ref={containerRef}
              initial={{ opacity: 0, y: -20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ type: "spring", duration: 0.32, bounce: 0.14 }}
              style={{
                width: "100%",
                maxWidth: 560,
                background: "rgba(14,21,37,0.97)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 18,
                boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
                overflow: "hidden",
                pointerEvents: "auto",
              }}
              onKeyDown={handleKey}
            >
              {/* Search input */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}>
                <Search size={16} style={{ color: "var(--text3)", flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => { setQuery(e.target.value); setCursor(0); }}
                  placeholder="Search actions, spaces…"
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    outline: "none",
                    color: "var(--text)",
                    fontSize: 14.5,
                    fontFamily: "inherit",
                  }}
                  autoComplete="off"
                  spellCheck={false}
                />
                <kbd style={{
                  fontSize: 10,
                  color: "var(--text3)",
                  background: "var(--surface3)",
                  padding: "2px 6px",
                  borderRadius: 5,
                  fontFamily: "inherit",
                  flexShrink: 0,
                }}>esc</kbd>
              </div>

              {/* Results */}
              <ul
                ref={listRef}
                role="listbox"
                aria-label="Command palette results"
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: "6px 0",
                  maxHeight: "min(400px, 60vh)",
                  overflowY: "auto",
                }}
              >
                {filtered.length === 0 && (
                  <li style={{
                    padding: "28px 16px",
                    textAlign: "center",
                    color: "var(--text3)",
                    fontSize: 13,
                  }}>
                    No results for &ldquo;{query}&rdquo;
                  </li>
                )}

                {Array.from(grouped.entries()).map(([group, items]) => (
                  <li key={group}>
                    <div style={{
                      padding: "6px 16px 3px",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--text3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}>
                      {group}
                    </div>
                    <ul role="group" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                      {items.map(item => {
                        const idx = flatIdx++;
                        const isActive = idx === cursor;
                        return (
                          <li
                            key={item.id}
                            role="option"
                            aria-selected={isActive}
                            data-cmd-idx={idx}
                            onClick={() => activate(idx)}
                            onMouseEnter={() => setCursor(idx)}
                            style={{
                              position: "relative",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "9px 16px",
                              cursor: "pointer",
                              color: item.danger ? "var(--red)" : "var(--text)",
                              transition: "color 0.1s",
                            }}
                          >
                            {/* Animated highlight bar */}
                            {isActive && (
                              <motion.div
                                layoutId="cmd-highlight"
                                transition={{ type: "spring", duration: 0.22, bounce: 0.1 }}
                                style={{
                                  position: "absolute",
                                  inset: "2px 6px",
                                  background: "rgba(255,255,255,0.06)",
                                  borderRadius: 9,
                                  zIndex: 0,
                                }}
                              />
                            )}
                            <span style={{
                              position: "relative",
                              zIndex: 1,
                              flexShrink: 0,
                              color: item.danger ? "var(--red)" : "var(--teal)",
                              display: "flex",
                            }}>
                              {item.icon}
                            </span>
                            <span style={{
                              position: "relative",
                              zIndex: 1,
                              flex: 1,
                              minWidth: 0,
                            }}>
                              <span style={{
                                display: "block",
                                fontSize: 13.5,
                                fontWeight: 500,
                              }}>
                                {item.label}
                              </span>
                              {item.description && (
                                <span style={{
                                  display: "block",
                                  fontSize: 11,
                                  color: "var(--text3)",
                                  marginTop: 1,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}>
                                  {item.description}
                                </span>
                              )}
                            </span>
                            {isActive && (
                              <span style={{
                                position: "relative",
                                zIndex: 1,
                                color: "var(--text3)",
                                flexShrink: 0,
                              }}>
                                <ArrowRight size={13} />
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>

              {/* Footer hint */}
              <div style={{
                display: "flex",
                gap: 16,
                padding: "8px 16px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                fontSize: 11,
                color: "var(--text3)",
              }}>
                <span><kbd style={kbdStyle}>↑↓</kbd> navigate</span>
                <span><kbd style={kbdStyle}>↵</kbd> select</span>
                <span><kbd style={kbdStyle}>esc</kbd> close</span>
                <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                  <Command size={10} /> K
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

const kbdStyle: React.CSSProperties = {
  background: "var(--surface3)",
  borderRadius: 4,
  padding: "1px 5px",
  fontSize: 10,
  fontFamily: "inherit",
  marginRight: 3,
};

/* ─────────────────────────────────────────────────────────────
   useCommandPalette — global ⌘K / Ctrl+K trigger
───────────────────────────────────────────────────────────── */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(v => !v);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return { open, setOpen };
}
