export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

export const inrS = (n) =>
  n >= 1e7
    ? '₹' + (n / 1e7).toFixed(2) + 'Cr'
    : n >= 1e5
    ? '₹' + (n / 1e5).toFixed(2) + 'L'
    : n >= 1e3
    ? '₹' + (n / 1e3).toFixed(1) + 'k'
    : inr(n);

export const fmtT = (t) => new Date(t).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

export const ago = (t) => {
  const m = Math.max(0, Math.round((Date.now() - t) / 60000));
  return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : Math.floor(m / 60) + 'h ' + (m % 60) + 'm ago';
};

export const toCSV = (rows) =>
  rows
    .map((r) =>
      r
        .map((c) => {
          c = String(c ?? '');
          return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c;
        })
        .join(',')
    )
    .join('\n');

export const toTSV = (rows) =>
  rows
    .map((r) =>
      r
        .map((c) => {
          let val = String(c ?? '');
          if (/[\t\r\n"]/.test(val)) {
            val = '"' + val.replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"';
          }
          return val;
        })
        .join('\t')
    )
    .join('\r\n');

const escapeHtml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const toHTMLTable = (rows) => {
  if (!rows || !rows.length) return '';
  const [header, ...body] = rows;
  const ths = header
    .map(
      (h) =>
        `<th style="border: 1px solid #374151; background-color: #111827; color: #ffffff; font-weight: bold; padding: 6px 12px; text-align: left;">${escapeHtml(
          h
        )}</th>`
    )
    .join('');
  const trs = body
    .map(
      (row, idx) =>
        `<tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">${row
          .map(
            (c) =>
              `<td style="border: 1px solid #d1d5db; padding: 6px 12px; text-align: left; color: #111827;">${escapeHtml(
                c
              )}</td>`
          )
          .join('')}</tr>`
    )
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><table style="border-collapse: collapse; font-family: Calibri, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11pt; border: 1px solid #d1d5db;"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></body></html>`;
};

export const fmtPhone = (p) => {
  const s = String(p || '').replace(/\D/g, '');
  if (s.length === 10) return `${s.slice(0, 5)} ${s.slice(5)}`;
  return String(p || '');
};

export const truncate = (str, maxLen) => {
  const s = String(str ?? '').trim();
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 1) + '…';
};

export const toAsciiTable = (headers, rows, colDefs = null) => {
  const cols = headers.map((h, i) => {
    if (colDefs && colDefs[i]) {
      return {
        header: h,
        width: colDefs[i].width || h.length,
        align: colDefs[i].align || 'left',
      };
    }
    let max = h.length;
    let isNumeric = true;
    for (const r of rows) {
      const val = String(r[i] ?? '');
      if (val.length > max) max = val.length;
      if (val && !/^[₹$\d,.\- ]+$/.test(val)) isNumeric = false;
    }
    return {
      header: h,
      width: Math.min(Math.max(max, h.length), 32),
      align: isNumeric ? 'right' : 'left',
    };
  });

  const border = '+' + cols.map((c) => '-'.repeat(c.width + 2)).join('+') + '+';

  const headerRow =
    '| ' +
    cols
      .map((c) => {
        const text = truncate(c.header, c.width);
        return text.padEnd(c.width, ' ');
      })
      .join(' | ') +
    ' |';

  const dataRows = rows.map((r) => {
    const cells = cols.map((c, i) => {
      const raw = String(r[i] ?? '');
      const text = truncate(raw, c.width);
      return c.align === 'right' ? text.padStart(c.width, ' ') : text.padEnd(c.width, ' ');
    });
    return '| ' + cells.join(' | ') + ' |';
  });

  return [border, headerRow, border, ...dataRows, border].join('\n');
};

export const copyTableData = async (arg1, arg2) => {
  let headers, rows, colDefs, fullRows;
  if (Array.isArray(arg1)) {
    headers = arg1[0];
    rows = arg1.slice(1);
    colDefs = arg2 || null;
    fullRows = rows;
  } else {
    headers = arg1.headers;
    rows = arg1.rows;
    colDefs = arg1.colDefs || null;
    fullRows = arg1.fullRows || rows;
  }

  const ascii = toAsciiTable(headers, rows, colDefs);
  const html = toHTMLTable([headers, ...(fullRows || rows)]);

  // 1. Modern Clipboard API: provides both HTML table and ASCII plain text
  if (typeof ClipboardItem !== 'undefined' && navigator?.clipboard?.write) {
    try {
      const textBlob = new Blob([ascii], { type: 'text/plain' });
      const htmlBlob = new Blob([html], { type: 'text/html' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': textBlob,
          'text/html': htmlBlob,
        }),
      ]);
      return { ok: true, text: ascii };
    } catch (e) {
      /* continue to fallbacks */
    }
  }

  // 2. ExecCommand copy event fallback
  try {
    let copied = false;
    const onCopy = (e) => {
      e.preventDefault();
      if (e.clipboardData) {
        e.clipboardData.setData('text/html', html);
        e.clipboardData.setData('text/plain', ascii);
        copied = true;
      }
    };
    document.addEventListener('copy', onCopy);
    document.execCommand('copy');
    document.removeEventListener('copy', onCopy);
    if (copied) return { ok: true, text: ascii };
  } catch (e) {
    /* continue to writeText */
  }

  // 3. Plain writeText with ASCII table
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(ascii);
      return { ok: true, text: ascii };
    } catch (e) {
      /* failed */
    }
  }

  return { ok: false, text: ascii };
};

export const mode = (a) => {
  const c = {};
  a.forEach((x) => (c[x] = (c[x] || 0) + 1));
  return Object.keys(c).sort((x, y) => c[y] - c[x])[0] || '';
};

export const niceMax = (v) => {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
};

export const store = {
  get(k) {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch (e) {
      /* ignore */
    }
  },
};
