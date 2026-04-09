export function stripHtmlToText(html) {
  const s = String(html || '');
  if (!s) return '';
  try {
    const doc = new DOMParser().parseFromString(s, 'text/html');
    return (doc.body?.textContent || '').replace(/\s+/g, ' ').trim();
  } catch {
    return s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

export function sanitizeBasicRichHtml(html) {
  const s = String(html || '');
  if (!s) return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(s, 'text/html');

    const allowedTags = new Set([
      'B', 'STRONG', 'I', 'EM', 'U',
      'P', 'DIV', 'BR',
      'SPAN', 'FONT',
      'UL', 'OL', 'LI',
      'H1', 'H2', 'H3', 'H4',
      'A',
    ]);
    const allowedAttrs = new Set(['style', 'color', 'face', 'size', 'href', 'target', 'rel']);
    const allowedStyleProps = new Set([
      'color',
      'font-size',
      'font-family',
      'font-weight',
      'font-style',
      'text-decoration',
      'text-align',
      'line-height',
    ]);

    const cleanStyle = (styleValue) => {
      const raw = String(styleValue || '');
      if (!raw) return '';
      const parts = raw.split(';').map((p) => p.trim()).filter(Boolean);
      const kept = [];
      for (const part of parts) {
        const idx = part.indexOf(':');
        if (idx <= 0) continue;
        const prop = part.slice(0, idx).trim().toLowerCase();
        const val = part.slice(idx + 1).trim();
        if (!allowedStyleProps.has(prop)) continue;
        if (/expression\s*\(/i.test(val)) continue;
        if (/url\s*\(/i.test(val)) continue;
        kept.push(`${prop}:${val}`);
      }
      return kept.join(';');
    };

    const walk = (node) => {
      const children = Array.from(node.childNodes || []);
      for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const el = child;
          const tag = el.tagName;
          if (!allowedTags.has(tag)) {
            const fragment = doc.createDocumentFragment();
            while (el.firstChild) fragment.appendChild(el.firstChild);
            el.replaceWith(fragment);
            continue;
          }

          const attrs = Array.from(el.attributes || []);
          for (const a of attrs) {
            const name = String(a.name || '').toLowerCase();
            if (!allowedAttrs.has(name)) {
              el.removeAttribute(a.name);
              continue;
            }
            if (name === 'style') {
              const cleaned = cleanStyle(el.getAttribute('style'));
              if (cleaned) el.setAttribute('style', cleaned);
              else el.removeAttribute('style');
            }
            if (name === 'href') {
              const href = String(el.getAttribute('href') || '').trim();
              if (!href || /^javascript:/i.test(href)) {
                el.removeAttribute('href');
              } else {
                el.setAttribute('rel', 'noreferrer noopener');
                el.setAttribute('target', '_blank');
              }
            }
          }
          walk(el);
        } else if (child.nodeType === Node.COMMENT_NODE) {
          child.remove();
        }
      }
    };

    walk(doc.body);
    return doc.body.innerHTML;
  } catch {
    return s;
  }
}

