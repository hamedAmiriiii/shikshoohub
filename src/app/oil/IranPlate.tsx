"use client";

import { useRef } from "react";
import { OIL_PLATE_LETTERS, isPlateComplete } from "@/app/lib/oil/plate";
import { toEnglishDigits } from "@/app/lib/oil/plate";
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

function openLetterSelect(el: HTMLSelectElement | null) {
  if (!el) return;
  el.focus();
  const picker = (el as HTMLSelectElement & { showPicker?: () => void }).showPicker;
  if (typeof picker === "function") {
    try {
      picker.call(el);
    } catch {
      /* مرورگر ممکن است showPicker را رد کند */
    }
  }
}

export default function IranPlate({
  parts,
  onChange,
  onComplete,
  readOnly = false,
  size = "md",
}: Props) {
  const serialRef = useRef<HTMLInputElement>(null);
  const letterRef = useRef<HTMLSelectElement>(null);
  const middleRef = useRef<HTMLInputElement>(null);
  const provinceRef = useRef<HTMLInputElement>(null);

  const set = (patch: Partial<OilPlateParts>) => {
    if (!onChange) return;
    onChange({ ...parts, ...patch });
  };

  return (
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
        <small>I.R.</small>
        <small>IRAN</small>
      </div>
      <div className="iran-plate-main">
        {readOnly ? (
          <span className="iran-serial">{parts.serial || "—"}</span>
        ) : (
          <input
            ref={serialRef}
            className="iran-serial"
            inputMode="numeric"
            maxLength={2}
            placeholder="12"
            value={parts.serial}
            onChange={(e) => {
              const serial = onlyDigits(e.target.value, 2);
              set({ serial });
              if (serial.length === 2) openLetterSelect(letterRef.current);
            }}
            aria-label="دو رقم اول"
          />
        )}
        {readOnly ? (
          <span className="iran-letter">{parts.letter || "ب"}</span>
        ) : (
          <select
            ref={letterRef}
            className="iran-letter"
            value={parts.letter || "ب"}
            onChange={(e) => {
              set({ letter: e.target.value });
              focusEnd(middleRef.current);
            }}
            onKeyDown={(e) => {
              if (e.key !== "Backspace") return;
              e.preventDefault();
              const serial = parts.serial.slice(0, -1);
              set({ serial });
              focusEnd(serialRef.current);
            }}
            aria-label="حرف پلاک"
          >
            {OIL_PLATE_LETTERS.map((letter) => (
              <option key={letter} value={letter}>
                {letter}
              </option>
            ))}
          </select>
        )}
        {readOnly ? (
          <span className="iran-middle">{parts.middle || "—"}</span>
        ) : (
          <input
            ref={middleRef}
            className="iran-middle"
            inputMode="numeric"
            maxLength={3}
            placeholder="345"
            value={parts.middle}
            onChange={(e) => {
              const middle = onlyDigits(e.target.value, 3);
              set({ middle });
              if (middle.length === 3) focusEnd(provinceRef.current);
            }}
            onKeyDown={(e) => {
              if (e.key !== "Backspace") return;
              if (parts.middle.length > 0) return;
              e.preventDefault();
              openLetterSelect(letterRef.current);
            }}
            aria-label="سه رقم وسط"
          />
        )}
      </div>
      <div className="iran-plate-right">
        <div className="iran-iran">ایران</div>
        {readOnly ? (
          <span className="iran-province">{parts.province || "—"}</span>
        ) : (
          <input
            ref={provinceRef}
            className="iran-province"
            inputMode="numeric"
            maxLength={2}
            placeholder="22"
            value={parts.province}
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
  );
}
