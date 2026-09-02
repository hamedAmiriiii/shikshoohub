"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import {
  OIL_PLATE_LETTERS,
  isPlateComplete,
  toEnglishDigits,
  toPersianDigits,
} from "@/app/lib/oil/plate";
import type { OilPlateParts } from "@/app/lib/oil/types";

type Size = "sm" | "md" | "lg";

type Props = {
  parts: OilPlateParts;
  onChange?: (parts: OilPlateParts) => void;
  onComplete?: () => void;
  readOnly?: boolean;
  size?: Size;
};

function onlyDigits(value: string, max: number) {
  return toEnglishDigits(value).replace(/\D/g, "").slice(0, max);
}

function focusEnd(el: HTMLInputElement | null) {
  if (!el) return;
  el.focus();
  const n = el.value.length;
  try {
    el.setSelectionRange(n, n);
  } catch {
    /* ignore */
  }
}

function isWideLetter(letter: string) {
  return letter === "الف" || letter === "معلولین";
}

export default function IranPlate({
  parts,
  onChange,
  onComplete,
  readOnly = false,
  size = "md",
}: Props) {
  const serialRef = useRef<HTMLInputElement>(null);
  const letterBtnRef = useRef<HTMLButtonElement>(null);
  const middleRef = useRef<HTMLInputElement>(null);
  const provinceRef = useRef<HTMLInputElement>(null);
  const [letterOpen, setLetterOpen] = useState(false);
  const letter = parts.letter || "ب";

  const set = (patch: Partial<OilPlateParts>) => {
    if (!onChange) return;
    onChange({ ...parts, ...patch });
  };

  const pickLetter = (next: string) => {
    set({ letter: next });
    setLetterOpen(false);
    requestAnimationFrame(() => focusEnd(middleRef.current));
  };

  useEffect(() => {
    if (!letterOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLetterOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [letterOpen]);

  return (
    <>
      <div
        className={`iran-plate ${size}`}
        dir="ltr"
        aria-label="پلاک ایران"
        data-complete={isPlateComplete(parts) ? "1" : "0"}
      >
        <div className="iran-plate-blue">
          <div className="iran-flag" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <small>IR</small>
          <small>Iran</small>
        </div>

        <div className="iran-plate-cell">
          {readOnly ? (
            <span className="iran-serial">{toPersianDigits(parts.serial) || "—"}</span>
          ) : (
            <input
              ref={serialRef}
              className="iran-serial"
              inputMode="numeric"
              maxLength={2}
              placeholder="۱۲"
              value={toPersianDigits(parts.serial)}
              onChange={(e) => {
                const serial = onlyDigits(e.target.value, 2);
                set({ serial });
                if (serial.length === 2) setLetterOpen(true);
              }}
              aria-label="دو رقم اول"
            />
          )}
        </div>

        <div className={`iran-plate-cell${isWideLetter(letter) ? " wide-letter" : ""}`}>
          {readOnly ? (
            <span className={`iran-letter${isWideLetter(letter) ? " wide" : ""}`}>{letter}</span>
          ) : (
            <button
              ref={letterBtnRef}
              type="button"
              className={`iran-letter${isWideLetter(letter) ? " wide" : ""}`}
              onClick={() => setLetterOpen(true)}
              onKeyDown={(e) => {
                if (e.key !== "Backspace") return;
                e.preventDefault();
                const serial = parts.serial.slice(0, -1);
                set({ serial });
                focusEnd(serialRef.current);
              }}
              aria-label="حرف پلاک"
              aria-haspopup="dialog"
              aria-expanded={letterOpen}
            >
              <ChevronDown size={size === "sm" ? 12 : 16} />
              <span>{letter}</span>
            </button>
          )}
        </div>

        <div className="iran-plate-cell iran-plate-middle">
          {readOnly ? (
            <span className="iran-middle">{toPersianDigits(parts.middle) || "—"}</span>
          ) : (
            <input
              ref={middleRef}
              className="iran-middle"
              inputMode="numeric"
              maxLength={3}
              placeholder="۳۴۵"
              value={toPersianDigits(parts.middle)}
              onChange={(e) => {
                const middle = onlyDigits(e.target.value, 3);
                set({ middle });
                if (middle.length === 3) focusEnd(provinceRef.current);
              }}
              onKeyDown={(e) => {
                if (e.key !== "Backspace") return;
                if (parts.middle.length > 0) return;
                e.preventDefault();
                setLetterOpen(true);
              }}
              aria-label="سه رقم وسط"
            />
          )}
        </div>

        <div className="iran-plate-cell iran-plate-right">
          <div className="iran-iran">ایران</div>
          {readOnly ? (
            <span className="iran-province">{toPersianDigits(parts.province) || "—"}</span>
          ) : (
            <input
              ref={provinceRef}
              className="iran-province"
              inputMode="numeric"
              maxLength={2}
              placeholder="۲۲"
              value={toPersianDigits(parts.province)}
              onChange={(e) => {
                const province = onlyDigits(e.target.value, 2);
                set({ province });
                const next = { ...parts, province };
                if (province.length === 2 && isPlateComplete(next)) {
                  onComplete?.();
                }
              }}
              onKeyDown={(e) => {
                if (e.key !== "Backspace") return;
                if (parts.province.length > 0) return;
                e.preventDefault();
                const middle = parts.middle.slice(0, -1);
                set({ middle });
                focusEnd(middleRef.current);
              }}
              aria-label="کد استان"
            />
          )}
        </div>
      </div>

      {letterOpen && (
        <div className="oil-modal-backdrop iran-letter-backdrop" onClick={() => setLetterOpen(false)}>
          <div
            className="iran-letter-sheet"
            role="dialog"
            aria-label="حرف پلاک"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="iran-letter-handle" />
            <div className="iran-letter-sheet-head">
              <button
                type="button"
                className="iran-letter-close"
                aria-label="بستن"
                onClick={() => setLetterOpen(false)}
              >
                <X size={16} />
              </button>
              <h3>حرف پلاک</h3>
              <span />
            </div>
            <div className="iran-letter-grid">
              {OIL_PLATE_LETTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`iran-letter-pick${item === letter ? " active" : ""}${
                    isWideLetter(item) ? " wide" : ""
                  }`}
                  onClick={() => pickLetter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
