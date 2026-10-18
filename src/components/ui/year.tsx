"use client";

import { useEffect, useState } from "react";

/** Renders the current year on the client (avoids `new Date()` during prerender). */
export function CurrentYear({ fallback = 2026 }: { fallback?: number }) {
  const [year, setYear] = useState(fallback);
  useEffect(() => setYear(new Date().getFullYear()), []);
  return <>{year}</>;
}
