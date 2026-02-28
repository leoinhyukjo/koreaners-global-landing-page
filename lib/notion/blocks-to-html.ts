import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveImageUrl } from "./image-upload";

// ─── Rich Text ───────────────────────────────────────────────

interface RichText {
  type: string;
  plain_text: string;
  href: string | null;
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
}

function richTextToHtml(richTexts: RichText[] | undefined): string {
  if (!richTexts || richTexts.length === 0) return "";

  return richTexts
    .map((rt) => {
      let text = escapeHtml(rt.plain_text);
      const { bold, italic, strikethrough, underline, code, color } =
        rt.annotations;

      if (code) text = `<code>${text}</code>`;
      if (bold) text = `<strong>${text}</strong>`;
      if (italic) text = `<em>${text}</em>`;
      if (strikethrough) text = `<s>${text}</s>`;
      if (underline) text = `<u>${text}</u>`;
      if (color && color !== "default") {
        const isBackground = color.endsWith("_background");
        const cssColor = color.replace("_background", "");
        const prop = isBackground ? "background-color" : "color";
        text = `<span style="${prop}:${cssColor}">${text}</span>`;
      }
      if (rt.href) {
        text = `<a href="${escapeAttr(rt.href)}">${text}</a>`;
      }

      return text;
    })
    .join("");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str: string): string {
  return escapeHtml(str).replace(/'/g, "&#39;");
}

// ─── Block → HTML Conversion ─────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

async function blockToHtml(
  block: any,
  supabase: SupabaseClient,
): Promise<string> {
  const type: string = block.type;
  const data = block[type];

  switch (type) {
    case "paragraph":
      return `<p>${richTextToHtml(data?.rich_text)}</p>`;

    case "heading_1":
      return `<h1>${richTextToHtml(data?.rich_text)}</h1>`;

    case "heading_2":
      return `<h2>${richTextToHtml(data?.rich_text)}</h2>`;

    case "heading_3":
      return `<h3>${richTextToHtml(data?.rich_text)}</h3>`;

    case "bulleted_list_item":
      // Wrapped by grouping logic in blocksToHtml
      return `<li>${richTextToHtml(data?.rich_text)}</li>`;

    case "numbered_list_item":
      return `<li>${richTextToHtml(data?.rich_text)}</li>`;

    case "code": {
      const lang = data?.language ?? "";
      const langAttr = lang ? ` class="language-${escapeAttr(lang)}"` : "";
      return `<pre><code${langAttr}>${richTextToHtml(data?.rich_text)}</code></pre>`;
    }

    case "quote":
      return `<blockquote>${richTextToHtml(data?.rich_text)}</blockquote>`;

    case "divider":
      return "<hr>";

    case "image": {
      const url = await resolveImageUrl(supabase, data);
      const captionHtml = richTextToHtml(data?.caption);
      const captionPlain = (data?.caption ?? [])
        .map((rt: RichText) => rt.plain_text)
        .join("");
      if (captionHtml) {
        return `<figure><img src="${escapeAttr(url)}" alt="${escapeAttr(captionPlain)}" loading="lazy"><figcaption>${captionHtml}</figcaption></figure>`;
      }
      return `<img src="${escapeAttr(url)}" alt="" loading="lazy">`;
    }

    case "toggle": {
      const summary = richTextToHtml(data?.rich_text);
      // Toggle children would need a recursive call with block.children
      // For now, render just the summary
      return `<details><summary>${summary}</summary></details>`;
    }

    case "table": {
      // Table block itself doesn't have content — rows come as children
      // This is handled by the table grouping logic below
      return "";
    }

    case "table_row": {
      const cells: RichText[][] = data?.cells ?? [];
      const tds = cells
        .map((cell) => `<td>${richTextToHtml(cell)}</td>`)
        .join("");
      return `<tr>${tds}</tr>`;
    }

    default:
      // Unsupported block types are silently skipped
      return "";
  }
}

// ─── Main Export ──────────────────────────────────────────────

/**
 * Convert an array of Notion blocks to an HTML string.
 * Handles list grouping (consecutive list items wrapped in <ul>/<ol>)
 * and table grouping (table block followed by table_row children).
 */
export async function blocksToHtml(
  blocks: any[],
  supabase: SupabaseClient,
): Promise<string> {
  if (!blocks || blocks.length === 0) return "";
  const htmlParts: string[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];
    const type: string = block?.type;

    if (!type) {
      i++;
      continue;
    }


    // Group consecutive bulleted_list_item
    if (type === "bulleted_list_item") {
      const items: string[] = [];
      while (i < blocks.length && blocks[i]?.type === "bulleted_list_item") {
        items.push(await blockToHtml(blocks[i], supabase));
        i++;
      }
      htmlParts.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    // Group consecutive numbered_list_item
    if (type === "numbered_list_item") {
      const items: string[] = [];
      while (i < blocks.length && blocks[i]?.type === "numbered_list_item") {
        items.push(await blockToHtml(blocks[i], supabase));
        i++;
      }
      htmlParts.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    // Table: render header + rows from children
    if (type === "table") {
      const hasColumnHeader: boolean = block.table?.has_column_header ?? false;
      const children: any[] = block.children ?? [];
      const rows: string[] = [];

      for (let r = 0; r < children.length; r++) {
        const row = children[r];
        if (row?.type !== "table_row") continue;
        const cells: RichText[][] = row.table_row?.cells ?? [];

        if (r === 0 && hasColumnHeader) {
          const ths = cells
            .map((cell) => `<th>${richTextToHtml(cell)}</th>`)
            .join("");
          rows.push(`<thead><tr>${ths}</tr></thead>`);
        } else {
          const tds = cells
            .map((cell) => `<td>${richTextToHtml(cell)}</td>`)
            .join("");
          rows.push(`<tr>${tds}</tr>`);
        }
      }

      // Wrap non-header rows in <tbody> if there's a header
      if (hasColumnHeader && rows.length > 1) {
        const header = rows[0];
        const body = rows.slice(1).join("");
        htmlParts.push(`<table>${header}<tbody>${body}</tbody></table>`);
      } else {
        htmlParts.push(`<table>${rows.join("")}</table>`);
      }

      i++;
      continue;
    }

    // Default: single block conversion
    const html = await blockToHtml(block, supabase);
    if (html) htmlParts.push(html);
    i++;
  }

  return htmlParts.join("\n");
}
