"use client";

import { OIL_PLATE_LETTERS, isPlateComplete } from "@/app/lib/oil/plate";
import { toEnglishDigits } from "@/app/lib/oil/plate";
import type { OilPlateParts } from "@/app/lib/oil/types";

type Size = "sm" | "md" | "lg";

type Props = {
  parts: OilPlateParts;
  onChange?: (parts: OilPlateParts) => void;
  readOnly?: boolean;
  size?: Size;
};

function onlyDigits(value: string, max: number) {
  return toEnglishDigits(value).replace(/\D/g, "").slice(0, max);
}

export default function IranPlate({
  parts,
  onChange,
  readOnly = false,
  size = "md",
}: Props) {
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
            className="iran-serial"
            inputMode="numeric"
            maxLength={2}
            placeholder="12"
            value={parts.serial}
            onChange={(e) => set({ serial: onlyDigits(e.target.value, 2) })}
            aria-label="دو رقم اول"
          />
        )}
        {readOnly ? (
          <span className="iran-letter">{parts.letter || "ب"}</span>
        ) : (
          <select
            className="iran-letter"
            value={parts.letter || "ب"}
            onChange={(e) => set({ letter: e.target.value })}
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
            className="iran-middle"
            inputMode="numeric"
            maxLength={3}
            placeholder="345"
            value={parts.middle}
            onChange={(e) => set({ middle: onlyDigits(e.target.value, 3) })}
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
            className="iran-province"
            inputMode="numeric"
            maxLength={2}
            placeholder="22"
            value={parts.province}
            onChange={(e) => set({ province: onlyDigits(e.target.value, 2) })}
            aria-label="کد استان"
          />
        )}
      </div>
    </div>
  );
}
