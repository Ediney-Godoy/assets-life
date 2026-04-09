import { describe, it, expect } from 'vitest';
import { sanitizeBasicRichHtml, stripHtmlToText } from './htmlText';

describe('htmlText utils', () => {
  it('stripHtmlToText removes tags and collapses whitespace', () => {
    expect(stripHtmlToText('<p>Olá <b>mundo</b></p>')).toBe('Olá mundo');
    expect(stripHtmlToText('   ')).toBe('');
  });

  it('sanitizeBasicRichHtml drops scripts and javascript href', () => {
    const input = '<p>Oi</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>';
    const out = sanitizeBasicRichHtml(input);
    expect(out).toContain('<p>Oi</p>');
    expect(out).not.toContain('script');
    expect(out).not.toContain('javascript:');
  });
});

