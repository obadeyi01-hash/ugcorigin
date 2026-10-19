"use client";

import { useEffect, useState } from "react";
import { Input, Select } from "@/components/ui/input";
import { COUNTRIES, DEFAULT_COUNTRY, parsePhone, toE164 } from "@/lib/phone";

/**
 * Country-code phone input. Emits an E.164 string (e.g. +2348012345678), or
 * null when empty/invalid. Defaults to Nigeria; the full African country list
 * is available for when we expand.
 */
export function PhoneField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (e164: string | null) => void;
}) {
  const initial = parsePhone(value);
  const [code, setCode] = useState(initial.code || DEFAULT_COUNTRY.code);
  const [national, setNational] = useState(initial.national);

  // Keep internal state in sync if the parent value changes externally.
  useEffect(() => {
    const p = parsePhone(value);
    setCode(p.code || DEFAULT_COUNTRY.code);
    setNational(p.national);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function emit(nextCode: string, nextNational: string) {
    const digits = nextNational.replace(/\D/g, "");
    onChange(digits ? toE164(nextCode, digits) : null);
  }

  return (
    <div className="flex gap-2">
      <div className="w-32 shrink-0">
        <Select
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            emit(e.target.value, national);
          }}
          aria-label="Country code"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} +{c.dial}
            </option>
          ))}
        </Select>
      </div>
      <Input
        type="tel"
        inputMode="numeric"
        value={national}
        onChange={(e) => {
          const v = e.target.value.replace(/[^\d\s-]/g, "");
          setNational(v);
          emit(code, v);
        }}
        placeholder="803 123 4567"
        className="flex-1"
      />
    </div>
  );
}
