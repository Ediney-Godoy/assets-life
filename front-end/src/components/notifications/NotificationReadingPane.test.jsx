import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../apiClient', () => ({
  getNotification: vi.fn(async () => ({})),
  markNotificationRead: vi.fn(async () => ({})),
  archiveNotification: vi.fn(async () => ({})),
}));

const { default: NotificationReadingPane } = await import('./NotificationReadingPane');

describe('NotificationReadingPane', () => {
  it('mostra placeholder quando nada está selecionado', () => {
    render(<NotificationReadingPane selectedId="" selectedSummary={null} />);
    expect(screen.getByText(/Selecione uma notificação/i)).toBeInTheDocument();
  });
});
