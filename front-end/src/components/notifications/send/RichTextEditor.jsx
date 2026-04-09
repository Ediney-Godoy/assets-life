import React from 'react';
import Button from '../../ui/Button';
import Select from '../../ui/Select';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Type,
} from 'lucide-react';
import { sanitizeBasicRichHtml, stripHtmlToText } from '../../../utils/htmlText';

function safeExec(command, value) {
  try {
    document.execCommand(command, false, value);
  } catch {}
}

const FONT_OPTIONS = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Times', value: 'Times New Roman' },
  { label: 'Courier', value: 'Courier New' },
];

const SIZE_OPTIONS = [
  { label: '12', value: '12px' },
  { label: '14', value: '14px' },
  { label: '16', value: '16px' },
  { label: '18', value: '18px' },
  { label: '20', value: '20px' },
  { label: '24', value: '24px' },
  { label: '28', value: '28px' },
];

export default function RichTextEditor({ label, value, onChange }) {
  const editorRef = React.useRef(null);
  const [font, setFont] = React.useState('Inter');
  const [fontSize, setFontSize] = React.useState('16px');
  const [color, setColor] = React.useState('#111827');

  React.useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const incoming = String(value || '');
    const current = String(el.innerHTML || '');
    if (incoming !== current) {
      el.innerHTML = incoming;
    }
  }, [value]);

  const emit = React.useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = sanitizeBasicRichHtml(el.innerHTML || '');
    const text = stripHtmlToText(html);
    onChange && onChange({ html, text });
  }, [onChange]);

  const applyFont = (nextFont) => {
    setFont(nextFont);
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    safeExec('fontName', nextFont);
    emit();
  };

  const applySize = (nextSize) => {
    setFontSize(nextSize);
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    safeExec('styleWithCSS', true);
    safeExec('fontSize', 4);
    try {
      const fonts = el.getElementsByTagName('font');
      for (const f of Array.from(fonts)) {
        if (String(f.size) === '4') {
          f.removeAttribute('size');
          f.style.fontSize = nextSize;
        }
      }
    } catch {}
    emit();
  };

  const applyColor = (nextColor) => {
    setColor(nextColor);
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    safeExec('styleWithCSS', true);
    safeExec('foreColor', nextColor);
    emit();
  };

  return (
    <div>
      {label ? (
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">{label}</div>
      ) : null}

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
        <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                <Type size={14} />
                Fonte
              </div>
              <Select value={font} onChange={(e) => applyFont(e.target.value)} className="h-9">
                {FONT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs text-slate-600 dark:text-slate-300">Tamanho</div>
              <Select value={fontSize} onChange={(e) => applySize(e.target.value)} className="h-9">
                {SIZE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                <Palette size={14} />
                Cor
              </div>
              <input
                type="color"
                value={color}
                onChange={(e) => applyColor(e.target.value)}
                className="h-9 w-12 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                aria-label="Cor da fonte"
                title="Cor da fonte"
              />
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

            <div className="flex items-center gap-1">
              <Button type="button" variant="secondary" size="sm" className="p-0 h-9 w-9 justify-center" title="Negrito" aria-label="Negrito" icon={<Bold size={16} />} onClick={() => { editorRef.current?.focus(); safeExec('bold'); emit(); }} />
              <Button type="button" variant="secondary" size="sm" className="p-0 h-9 w-9 justify-center" title="Itálico" aria-label="Itálico" icon={<Italic size={16} />} onClick={() => { editorRef.current?.focus(); safeExec('italic'); emit(); }} />
              <Button type="button" variant="secondary" size="sm" className="p-0 h-9 w-9 justify-center" title="Sublinhado" aria-label="Sublinhado" icon={<Underline size={16} />} onClick={() => { editorRef.current?.focus(); safeExec('underline'); emit(); }} />
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

            <div className="flex items-center gap-1">
              <Button type="button" variant="secondary" size="sm" className="p-0 h-9 w-9 justify-center" title="Alinhar à esquerda" aria-label="Alinhar à esquerda" icon={<AlignLeft size={16} />} onClick={() => { editorRef.current?.focus(); safeExec('justifyLeft'); emit(); }} />
              <Button type="button" variant="secondary" size="sm" className="p-0 h-9 w-9 justify-center" title="Centralizar" aria-label="Centralizar" icon={<AlignCenter size={16} />} onClick={() => { editorRef.current?.focus(); safeExec('justifyCenter'); emit(); }} />
              <Button type="button" variant="secondary" size="sm" className="p-0 h-9 w-9 justify-center" title="Alinhar à direita" aria-label="Alinhar à direita" icon={<AlignRight size={16} />} onClick={() => { editorRef.current?.focus(); safeExec('justifyRight'); emit(); }} />
              <Button type="button" variant="secondary" size="sm" className="p-0 h-9 w-9 justify-center" title="Justificar" aria-label="Justificar" icon={<AlignJustify size={16} />} onClick={() => { editorRef.current?.focus(); safeExec('justifyFull'); emit(); }} />
            </div>
          </div>
        </div>

        <div
          ref={editorRef}
          className="min-h-[220px] p-3 outline-none text-slate-900 dark:text-slate-100"
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          style={{ fontFamily: 'Inter, ui-sans-serif, system-ui', fontSize: '16px' }}
          aria-label="Editor de mensagem"
        />
      </div>
    </div>
  );
}

