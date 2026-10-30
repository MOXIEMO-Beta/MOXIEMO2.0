export interface LegalHeading { text: string; id: string }

export function headingId(text: string) {
  const number = text.match(/^\s*(\d+)\./);
  return number ? `section-${number[1]}` : text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/\s+/g, "-");
}

export function isSummary(text: string) {
  return /^(the short version|the program at a glance)$/i.test(text.trim());
}

export function parseLegalContent(markdown: string) {
  const lines = markdown.trim().split(/\r?\n/);
  const titleIndex = lines.findIndex(line => /^#\s+/.test(line));
  const title = titleIndex < 0 ? "" : lines[titleIndex].replace(/^#\s+/, "");
  let start = titleIndex + 1;
  while (start < lines.length && !lines[start].trim()) start++;
  const dateStart = start;
  while (start < lines.length && lines[start].trim() && !/^#{1,6}\s/.test(lines[start])) start++;
  const date = lines.slice(dateStart, start).join("\n");
  const body = lines.slice(start).join("\n").trim();
  const headings = [...body.matchAll(/^##\s+(.+?)\s*#*$/gm)].map(match => ({ text: match[1], id: headingId(match[1]) }));
  const summaryHeading = headings.find(heading => isSummary(heading.text));
  let intro = "";
  let summary = "";
  let content = body;
  if (summaryHeading) {
    const marker = new RegExp(`^##\\s+${summaryHeading.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*#*$`, "m");
    const match = marker.exec(body);
    if (match) {
      intro = body.slice(0, match.index).trim();
      const remaining = body.slice(match.index);
      const nextHeading = remaining.slice(match[0].length).search(/^##\s+/m);
      const end = nextHeading < 0 ? remaining.length : match[0].length + nextHeading;
      summary = remaining.slice(0, end).trim();
      content = remaining.slice(end).trim();
    }
  }
  return { title, date, intro, summary, content, headings: headings.filter(heading => !isSummary(heading.text)) };
}