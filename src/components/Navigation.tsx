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
  setVistaActual: (vista: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ vistaActual, setVistaActual }) => {
  const [modoOscuro, setModoOscuro] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (modoOscuro) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
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
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Menú de Vistas con iconos vectoriales */}
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2">
            {menuItems.map((item) => {
              const Icono = item.icon;
              const activo = vistaActual === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setVistaActual(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activo
                      ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icono className="w-4 h-4" />
                  <span>{item.nombre}</span>
                </button>
              );
            })}
          </div>

          {/* Opciones Derechas: Configuración, Modo Oscuro y Cerrar Sesión */}
          <div className="flex items-center space-x-2 pl-2">
            <button
              onClick={toggleTema}
              title={modoOscuro ? 'Modo Claro' : 'Modo Oscuro'}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {modoOscuro ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <button
              onClick={() => setVistaActual('configuracion')}
              title="Configuración"
              className={`p-2 rounded-xl transition-colors ${
                vistaActual === 'configuracion'
                  ? 'bg-slate-900 text-white dark:bg-sky-500'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => cerrarSesion()}
              title="Cerrar Sesión"
              className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};
