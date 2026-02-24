# ActionToolbar

Padrão único de barra de ações para o sistema, com ordem fixa e somente ícones.

## Regras
- Ordem obrigatória: `Novo`, `Salvar`, `Editar`, `Excluir`, `Imprimir`, `Exportar PDF`, `Exportar Excel`.
- Somente ícones, sem texto ao lado.
- Botões compactos com contorno visível: `p-1 h-9 w-9 justify-center`.
- Ícones lucide em `size=18`; `Salvar` com `text-slate-700` para contraste.
- `PDF` e `Excel` devem usar exatamente `front-end/public/Pdf.svg` e `front-end/public/Excel.svg`.
- `Salvar` sempre visível; `Editar` e `Excluir` podem ser desabilitados quando não há registro.

## Uso

```jsx
import ActionToolbar from '../components/ActionToolbar';

<ActionToolbar
  onNew={onNew}
  onSave={onSave}
  onEdit={() => editingId && onEdit(findRow(editingId))}
  onDelete={() => editingId && onDelete(editingId)}
  onPrint={() => window.print()}
  onExportPdf={exportPDF}
  onExportExcel={exportExcel}
  canEditDelete={!!editingId}
/>
```

## Conformidade
- Execute `npm run check:toolbar` para garantir que as páginas usam `ActionToolbar` e não possuem variações locais.
- Novas telas devem sempre importar e usar `ActionToolbar` para a barra de ações.