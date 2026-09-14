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
      document.body.style.backgroundColor = '#0f172a';
      document.body.style.color = '#f8fafc';
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

  return (
    <nav style={{
      background: modoOscuro ? '#1e293b' : '#ffffff',
      borderBottom: modoOscuro ? '1px solid #334155' : '1px solid #e2e8f0',
      padding: '12px 24px',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px'
    }}>
      {/* Grupo Izquierdo: Botones del Menú Principal */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        scrollbarWidth: 'none'
      }}>
        {menuItems.map((item) => {
          const Icono = item.icon;
          const activo = vistaActual === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setVistaActual(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '12px',
                border: 'none',
                background: activo 
                  ? (modoOscuro ? '#38bdf8' : '#0f172a') 
                  : 'transparent',
                color: activo 
                  ? '#ffffff' 
                  : (modoOscuro ? '#94a3b8' : '#64748b'),
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icono size={16} strokeWidth={2.2} />
              <span>{item.nombre}</span>
            </button>
          );
        })}
      </div>

      {/* Grupo Derecho: Configuración, Modo Oscuro y Salir */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {/* Botón Modo Oscuro / Claro */}
        <button
          onClick={toggleTema}
          title={modoOscuro ? 'Modo Claro' : 'Modo Oscuro'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            border: modoOscuro ? '1px solid #334155' : '1px solid #e2e8f0',
            background: modoOscuro ? '#0f172a' : '#f8fafc',
            color: modoOscuro ? '#fbbf24' : '#475569',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {modoOscuro ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Botón Configuración */}
        <button
          onClick={() => setVistaActual('configuracion')}
          title="Configuración"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            border: vistaActual === 'configuracion' 
              ? 'none' 
              : (modoOscuro ? '1px solid #334155' : '1px solid #e2e8f0'),
            background: vistaActual === 'configuracion' 
              ? (modoOscuro ? '#38bdf8' : '#0f172a') 
              : (modoOscuro ? '#0f172a' : '#f8fafc'),
            color: vistaActual === 'configuracion' 
              ? '#ffffff' 
              : (modoOscuro ? '#94a3b8' : '#475569'),
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Settings size={18} />
        </button>

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
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            border: 'none',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
};
