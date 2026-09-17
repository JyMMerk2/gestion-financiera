import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  PieChart, 
  PiggyBank, 
  Building2, 
  CreditCard, 
  Target,
  Settings, 
  Moon, 
  Sun, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { cerrarSesion } from '../services/auth';

export interface NavigationProps {
  vistaActual: string;
  setVistaActual: (vista: any) => void;
  onLogout: () => void;
  modoOscuro: boolean;
  setModoOscuro: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  vistaActual, 
  setVistaActual, 
  onLogout,
  modoOscuro,
  setModoOscuro
}) => {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const toggleTema = () => setModoOscuro(prev => !prev);

  const menuItems = [
    { id: 'dashboard', nombre: 'Dashboard', icon: LayoutDashboard },
    { id: 'presupuesto', nombre: 'Presupuesto', icon: PieChart },
    { id: 'ahorros', nombre: 'Ahorros', icon: PiggyBank },
    { id: 'patrimonio', nombre: 'Patrimonio', icon: Building2 },
    { id: 'prestamos', nombre: 'Préstamos', icon: CreditCard },
    { id: 'metas', nombre: 'Metas', icon: Target },
  ];

  // Paleta Dark Neón / Cyberpunk
  const bgColor = modoOscuro ? '#0a0e14' : '#ffffff';
  const borderColor = modoOscuro ? '#1f2937' : '#e2e8f0';

  const navegar = (id: string) => {
    setVistaActual(id);
    setMenuAbierto(false);
  };

  return (
    <header style={{
      background: bgColor,
      borderBottom: `1px solid ${borderColor}`,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: modoOscuro ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 6px -1px rgba(0, 0, 0, 0.03)'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 16px',
        minHeight: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap'
      }}>
        
        {/* LOGO + NAVEGACIÓN DESKTOP */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          
          <div 
            onClick={() => navegar('dashboard')}
            style={{ 
              fontSize: '14px', 
              fontWeight: '900', 
              letterSpacing: '0.05em', 
              color: modoOscuro ? '#00e5ff' : '#0f172a',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            Gestión Financiera
          </div>

          {/* Menú Visible en Pantallas Medianas/Grandes */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="nav-desktop">
            {menuItems.map((item) => {
              const Icono = item.icon;
              const activo = vistaActual === item.id;
              
              const itemBg = activo 
                ? (modoOscuro ? 'rgba(0, 229, 255, 0.12)' : '#0f172a') 
                : 'transparent';
              
              const itemColor = activo 
                ? (modoOscuro ? '#00e5ff' : '#ffffff') 
                : (modoOscuro ? '#94a3b8' : '#64748b');

              return (
                <button
                  key={item.id}
                  onClick={() => navegar(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: activo && modoOscuro ? '1px solid #00e5ff44' : 'none',
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

        {/* ACCIONES DE LA DERECHA & BOTÓN MENÚ MÓVIL */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          
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
              color: modoOscuro ? '#ffea00' : '#64748b',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {modoOscuro ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={() => navegar('configuracion')}
            title="Configuración"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: vistaActual === 'configuracion' 
                ? '1px solid #00e5ff' 
                : `1px solid ${borderColor}`,
              background: vistaActual === 'configuracion' 
                ? 'rgba(0, 229, 255, 0.15)' 
                : 'transparent',
              color: vistaActual === 'configuracion' 
                ? '#00e5ff' 
                : (modoOscuro ? '#94a3b8' : '#64748b'),
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <Settings size={16} />
          </button>

          <div style={{ width: '1px', height: '20px', background: borderColor, margin: '0 2px' }} />

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
              padding: '8px 10px',
              borderRadius: '8px',
              border: 'none',
              background: modoOscuro ? 'rgba(255, 0, 127, 0.15)' : '#fef2f2',
              color: '#ff007f',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <LogOut size={15} />
            <span className="text-salir">Salir</span>
          </button>

          {/* Botón Menú Hamburguesa para Teléfonos */}
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="btn-hamburguesa"
            style={{
              background: 'transparent',
              border: 'none',
              color: modoOscuro ? '#f8fafc' : '#0f172a',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {menuAbierto ? <X size={22} /> : <Menu size={22} />}
          </button>

        </div>

        {/* MENÚ MÓVIL DESPLEGABLE */}
        {menuAbierto && (
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            padding: '12px 0 16px 0',
            borderTop: `1px solid ${borderColor}`,
            marginTop: '8px'
          }}>
            {menuItems.map((item) => {
              const Icono = item.icon;
              const activo = vistaActual === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navegar(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activo ? (modoOscuro ? 'rgba(0, 229, 255, 0.15)' : '#0f172a') : 'transparent',
                    color: activo ? (modoOscuro ? '#00e5ff' : '#ffffff') : (modoOscuro ? '#94a3b8' : '#64748b'),
                    fontSize: '13px',
                    fontWeight: '700',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <Icono size={16} />
                  <span>{item.nombre}</span>
                </button>
              );
            })}
          </div>
        )}

      </div>

      {/* ESTILOS CSS INLINE PARA CONTROLAR RESPONSIVIDAD SEGÚN TAMAÑO DE PANTALLA */}
      <style>{`
        @media (max-width: 768px) {
          .nav-desktop {
            display: none !important;
          }
          .btn-hamburguesa {
            display: flex !important;
          }
          .text-salir {
            display: none !important;
          }
        }
        @media (min-width: 769px) {
          .btn-hamburguesa {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
