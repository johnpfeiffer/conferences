export type TranscriptRow = {
  id: number;
  timestamp: string;
  original: string;
  fixed: string;
  changed: boolean;
};

export type DiffToken = {
  text: string;
  changed: boolean;
};

const TIMESTAMP = /^(\d{1,2}:)?\d{1,2}:\d{2}$/;
const TOKEN = /(\s+|[.,!?;:()[\]{}"'“”‘’—–/-]+)/;

export function buildTranscriptRows(original: string, fixed: string): TranscriptRow[] {
  const originalLines = original.split(/\r?\n/);
  const fixedLines = fixed.split(/\r?\n/);
  const rows: TranscriptRow[] = [];
  let timestamp = "0:00";
  let inBody = false;

  for (let index = 0; index < Math.max(originalLines.length, fixedLines.length); index += 1) {
    const originalLine = originalLines[index] ?? "";
    const fixedLine = fixedLines[index] ?? "";
    const trimmedOriginal = originalLine.trim();

    if (trimmedOriginal === "---") {
      inBody = true;
      continue;
    }
    if (!inBody) continue;
    if (TIMESTAMP.test(trimmedOriginal)) {
      timestamp = trimmedOriginal;
      continue;
    }
    if (!trimmedOriginal && !fixedLine.trim()) continue;

    rows.push({
      id: index,
      timestamp,
      original: originalLine.trim(),
      fixed: fixedLine.trim(),
      changed: originalLine !== fixedLine,
    });
  }

  return rows;
}

function tokenize(value: string): string[] {
  return value.split(TOKEN).filter(Boolean);
}

export function diffTranscriptWords(
  original: string,
  fixed: string,
): { original: DiffToken[]; fixed: DiffToken[] } {
  const before = tokenize(original);
  const after = tokenize(fixed);
  const table = Array.from({ length: before.length + 1 }, () =>
    Array<number>(after.length + 1).fill(0));

  for (let left = before.length - 1; left >= 0; left -= 1) {
    for (let right = after.length - 1; right >= 0; right -= 1) {
      table[left][right] = before[left] === after[right]
        ? table[left + 1][right + 1] + 1
        : Math.max(table[left + 1][right], table[left][right + 1]);
    }
  }

  const originalTokens: DiffToken[] = [];
  const fixedTokens: DiffToken[] = [];
  let left = 0;
  let right = 0;

  while (left < before.length || right < after.length) {
    if (left < before.length && right < after.length && before[left] === after[right]) {
      originalTokens.push({ text: before[left], changed: false });
      fixedTokens.push({ text: after[right], changed: false });
      left += 1;
      right += 1;
    } else if (
      right < after.length
      && (left === before.length || table[left][right + 1] >= table[left + 1][right])
    ) {
      fixedTokens.push({ text: after[right], changed: true });
      right += 1;
    } else {
      originalTokens.push({ text: before[left], changed: true });
      left += 1;
    }
  }

  return { original: originalTokens, fixed: fixedTokens };
}
