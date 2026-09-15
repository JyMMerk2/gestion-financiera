import React, { useState, useEffect, ReactNode } from 'react';

interface ModuloLayoutProps {
  tituloFormulario: string;
  tituloHistorial: string;
  colorTema: string; // Ej: '#8b5cf6' (violeta), '#f59e0b' (naranja)
  formulario: ReactNode;
  historial: ReactNode;
}

export const ModuloLayout: React.FC<ModuloLayoutProps> = ({
  tituloFormulario,
  tituloHistorial,
  colorTema,
  formulario,
  historial
}) => {
  const [esOscuro, setEsOscuro] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  // Detecta el cambio de tema (Sol / Luna) en tiempo real
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

  // Estilos adaptativos dinámicos
  const bgCard = esOscuro ? '#1e293b' : '#ffffff';
  const borderCard = esOscuro ? '#334155' : '#e5e7eb';
  const textPrimary = esOscuro ? '#f8fafc' : '#1e293b';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '14px' }}>
      
      {/* Columna Izquierda: Formulario */}
      <div style={{
        background: bgCard,
        border: `1px solid ${borderCard}`,
        borderRadius: '14px',
        padding: '16px',
        color: textPrimary,
        transition: 'all 0.3s'
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '800',
          textTransform: 'uppercase',
          marginBottom: '12px',
          borderBottom: `1px solid ${borderCard}`,
          paddingBottom: '6px',
          color: colorTema
        }}>
          {tituloFormulario}
        </div>
        {formulario}
      </div>

      {/* Columna Derecha: Historial */}
      <div style={{
        background: bgCard,
        border: `1px solid ${borderCard}`,
        borderRadius: '14px',
        padding: '16px',
        color: textPrimary,
        transition: 'all 0.3s'
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '800',
          textTransform: 'uppercase',
          marginBottom: '12px',
          borderBottom: `1px solid ${borderCard}`,
          paddingBottom: '6px',
          color: colorTema
        }}>
          {tituloHistorial}
        </div>
        {historial}
      </div>

    </div>
  );
};
