import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationList from './NotificationList';

describe('NotificationList', () => {
  it('renderiza itens e dispara onSelect ao clicar', () => {
    const onSelect = vi.fn();
    render(
      <NotificationList
        items={[
          { id: 1, titulo: 'A', mensagem: 'Mensagem A', status: 'pendente', created_at: '2026-02-10T10:30:00Z', remetente: 'Fulano' },
          { id: 2, titulo: 'B', mensagem: 'Mensagem B', status: 'lida', created_at: '2026-02-11T10:30:00Z', remetente: 'Ciclano' },
        ]}
        selectedId="1"
        onSelect={onSelect}
      />
    );

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();

    fireEvent.click(screen.getByText('B'));
    expect(onSelect).toHaveBeenCalledWith('2');
  });

  it('mostra estado vazio quando não há itens', () => {
    render(<NotificationList items={[]} emptyLabel="Vazio" />);
    expect(screen.getByText('Vazio')).toBeInTheDocument();
  });
});

