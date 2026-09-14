import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PieChart, 
  PiggyBank, 
  Building2, 
  CreditCard, 
  Settings, 
  Moon, 
  Sun, 
  LogOut 
} from 'lucide-react';
import { cerrarSesion } from '../services/auth';

interface NavigationProps {
  vistaActual: string;
  setVistaActual: (vista: any) => void;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ vistaActual, setVistaActual, onLogout }) => {
  const [modoOscuro, setModoOscuro] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (modoOscuro) {
      document.body.style.backgroundColor = '#0b0f19';
      document.body.style.color = '#f1f5f9';
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.color = '#0f172a';
      localStorage.setItem('theme', 'light');
    }
  }, [modoOscuro]);

  const toggleTema = () => setModoOscuro(!modoOscuro);

  const menuItems = [
    { id: 'dashboard', nombre: 'Dashboard', icon: LayoutDashboard },
    { id: 'presupuesto', nombre: 'Presupuesto', icon: PieChart },
    { id: 'ahorros', nombre: 'Ahorros', icon: PiggyBank },
    { id: 'patrimonio', nombre: 'Patrimonio', icon: Building2 },
    { id: 'prestamos', nombre: 'Préstamos', icon: CreditCard },
  ];

  const bgColor = modoOscuro ? '#111827' : '#ffffff';
  const borderColor = modoOscuro ? '#1f2937' : '#e2e8f0';

  return (
    <header style={{
      background: bgColor,
      borderBottom: `1px solid ${borderColor}`,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        
        {/* LOGO + NAVEGACIÓN PRINCIPAL */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          
          {/* Nombre de la App */}
          <div style={{ 
            fontSize: '15px', 
            fontWeight: '900', 
            letterSpacing: '-0.02em', 
            color: modoOscuro ? '#38bdf8' : '#0f172a',
            textTransform: 'uppercase'
          }}>
            Gestión Financiera
          </div>

          {/* Menú de Botones Modernos */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {menuItems.map((item) => {
              const Icono = item.icon;
              const activo = vistaActual === item.id;
              
              const itemBg = activo 
                ? (modoOscuro ? '#1e293b' : '#0f172a') 
                : 'transparent';
              
              const itemColor = activo 
                ? '#ffffff' 
                : (modoOscuro ? '#94a3b8' : '#64748b');

              return (
                <button
                  key={item.id}
                  onClick={() => setVistaActual(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: itemBg,
                    color: itemColor,
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    outline: 'none'
                  }}
                >
                  <Icono size={15} strokeWidth={activo ? 2.5 : 2} />
                  <span>{item.nombre}</span>
                </button>
              );
            })}
          </nav>

        </div>

        {/* ACCIONES DE LA DERECHA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          
          {/* Toggle Modo Oscuro */}
          <button
            onClick={toggleTema}
            title={modoOscuro ? 'Modo Claro' : 'Modo Oscuro'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: `1px solid ${borderColor}`,
              background: 'transparent',
              color: modoOscuro ? '#f59e0b' : '#64748b',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {modoOscuro ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Botón Configuración */}
          <button
            onClick={() => setVistaActual('configuracion')}
            title="Configuración"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: vistaActual === 'configuracion' 
                ? 'none' 
                : `1px solid ${borderColor}`,
              background: vistaActual === 'configuracion' 
                ? (modoOscuro ? '#38bdf8' : '#0f172a') 
                : 'transparent',
              color: vistaActual === 'configuracion' 
                ? '#ffffff' 
                : (modoOscuro ? '#94a3b8' : '#64748b'),
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <Settings size={16} />
          </button>

          <div style={{ width: '1px', height: '20px', background: borderColor, margin: '0 4px' }} />

          {/* Botón Cerrar Sesión */}
          <button
            onClick={async () => {
              await cerrarSesion();
              onLogout();
            }}
            title="Cerrar Sesión"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: modoOscuro ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
              color: '#ef4444',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <LogOut size={15} />
            <span>Salir</span>
          </button>

        </div>

      </div>
    </header>
  );
};
