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

  // Paleta Dark Neón / Cyberpunk
  const bgCard = esOscuro ? '#11161d' : '#ffffff';
  const borderCard = esOscuro ? '#1f2937' : '#e5e7eb';
  const textPrimary = esOscuro ? '#f8fafc' : '#1e293b';
  const textSecondary = esOscuro ? '#94a3b8' : '#6b7280';
  const textLabel = esOscuro ? '#00e5ff' : '#6b7280';
  const bgInput = esOscuro ? '#0a0e14' : '#f9fafb';
  const borderInput = esOscuro ? '#1f2937' : '#d1d5db';
  const textTitle = esOscuro ? '#00e5ff' : '#2563eb';

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '9px',
    borderRadius: '8px',
    border: `1px solid ${borderInput}`,
    background: bgInput,
    color: textPrimary,
    outline: 'none',
    boxSizing: 'border-box',
    fontSize: '12px'
  };

  return {
    esOscuro,
    bgCard,
    borderCard,
    textPrimary,
    textSecondary,
    textLabel,
    bgInput,
    borderInput,
    textTitle,
    inputStyle
  };
};
