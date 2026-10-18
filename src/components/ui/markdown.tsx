import type { ReactNode } from "react";

/**
 * Minimal, safe Markdown renderer for admin-authored doc pages.
 * Supports: ## / ### headings, - bullet and 1. numbered lists, blank-line
 * paragraphs, **bold**, and [text](https://link). Text is rendered as React
 * nodes (never dangerouslySetInnerHTML), and link hrefs are restricted to
 * http(s) and mailto, so admin content can't inject scripts.
 */

function renderInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Tokenise **bold** and [label](url) in one pass.
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      nodes.push(
        <strong key={`${keyBase}-b${i}`} className="font-semibold text-ink">
          {m[1]}
        </strong>,
      );
    } else if (m[2] !== undefined) {
      const href = m[3].trim();
      const safe = /^(https?:|mailto:|\/)/i.test(href) ? href : "#";
      nodes.push(
        <a
          key={`${keyBase}-a${i}`}
          href={safe}
          className="font-medium text-accent hover:underline"
          {...(safe.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {m[2]}
        </a>,
      );
    }
    last = re.lastIndex;
    i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ body }: { body: string }) {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      i++;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      blocks.push(
        <h3 key={key++} className="mt-6 font-display text-lg font-semibold text-ink">
          {renderInline(trimmed.slice(4), `h${key}`)}
        </h3>,
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push(
        <h2 key={key++} className="mt-8 font-display text-xl font-semibold text-ink">
          {renderInline(trimmed.slice(3), `h${key}`)}
        </h2>,
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      blocks.push(
        <h2 key={key++} className="mt-8 font-display text-2xl font-bold text-ink">
          {renderInline(trimmed.slice(2), `h${key}`)}
        </h2>,
      );
      i++;
      continue;
    }

    // Lists: consecutive - or N. lines.
    const isBullet = /^[-*]\s+/.test(trimmed);
    const isNumber = /^\d+\.\s+/.test(trimmed);
    if (isBullet || isNumber) {
      const items: ReactNode[] = [];
      let j = i;
      while (j < lines.length) {
        const t = lines[j].trim();
        const b = /^[-*]\s+/.test(t);
        const n = /^\d+\.\s+/.test(t);
        if (!b && !n) break;
        items.push(
          <li key={`${key}-${j}`}>{renderInline(t.replace(/^([-*]|\d+\.)\s+/, ""), `li${key}-${j}`)}</li>,
        );
        j++;
      }
      blocks.push(
        isNumber ? (
          <ol key={key++} className="mt-3 ml-5 list-decimal space-y-1.5 text-ink-2 marker:text-ink-3">
            {items}
          </ol>
        ) : (
          <ul key={key++} className="mt-3 ml-5 list-disc space-y-1.5 text-ink-2 marker:text-ink-3">
            {items}
          </ul>
        ),
      );
      i = j;
      continue;
    }

    // Paragraph: gather until blank line.
    const para: string[] = [];
    let j = i;
    while (j < lines.length && lines[j].trim() !== "" && !/^(#{1,3}\s|[-*]\s|\d+\.\s)/.test(lines[j].trim())) {
      para.push(lines[j].trim());
      j++;
    }
    blocks.push(
      <p key={key++} className="mt-3 leading-relaxed text-ink-2">
        {renderInline(para.join(" "), `p${key}`)}
      </p>,
    );
    i = j;
  }

  return <div className="text-[0.95rem]">{blocks}</div>;
}
