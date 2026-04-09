import React from 'react';
import { Navigate, useParams, useLocation } from 'react-router-dom';

export default function NotificationLegacyRedirect() {
  const { id } = useParams();
  const location = useLocation();

  const target = React.useMemo(() => {
    const raw = String(id || '').trim();
    if (!raw) return '/notifications';
    const p = new URLSearchParams(location.search || '');
    p.set('id', raw);
    return `/notifications?${p.toString()}`;
  }, [id, location.search]);

  return <Navigate to={target} replace />;
}

