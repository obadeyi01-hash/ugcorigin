// The content formats a creator can offer. "video" is the default UGC; the
// others let creators advertise voice-over, text/scripts and photo work.
export const CONTENT_FORMATS: { value: string; label: string }[] = [
  { value: "video", label: "On-camera video" },
  { value: "voiceover", label: "Voice-over" },
  { value: "text", label: "Text / scripts" },
  { value: "photo", label: "Photo" },
];

const LABELS = new Map(CONTENT_FORMATS.map((f) => [f.value, f.label]));

export function formatLabel(value: string): string {
  return LABELS.get(value) ?? value;
}
