import { useState, useEffect, CSSProperties } from 'react';

export const useModoOscuro = () => {
  const [esOscuro, setEsOscuro] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setEsOscuro(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    return () => observer.disconnect();
  }, []);

  const bgCard = esOscuro ? '#1e293b' : '#ffffff';
  const borderCard = esOscuro ? '#334155' : '#e5e7eb';
  const textPrimary = esOscuro ? '#f8fafc' : '#1e293b';
  const textLabel = esOscuro ? '#94a3b8' : '#6b7280';
  const bgInput = esOscuro ? '#0f172a' : '#f9fafb';
  const borderInput = esOscuro ? '#475569' : '#d1d5db';

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '9px',
    borderRadius: '8px',
    border: `1px solid ${borderInput}`,
    background: bgInput,
    color: textPrimary,
    outline: 'none',
    boxSizing: 'border-box'
  };

  return {
    esOscuro,
    bgCard,
    borderCard,
    textPrimary,
    textLabel,
    bgInput,
    inputStyle
  };
};
