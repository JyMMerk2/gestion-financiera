import { useState, useEffect } from 'react';
import { AuthModal } from './components/AuthModal';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { Presupuesto } from './components/Presupuesto';
import { Ahorros } from './components/Ahorros';
import { Patrimonio } from './components/Patrimonio';
import Prestamos from './components/Prestamos';
import { obtenerPerfilUsuario, cerrarSesion } from './services/auth';

export default function App() {
  const [perfil, setPerfil] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [errorInicial, setErrorInicial] = useState<string | null>(null);
  const [seccionActual, setSeccionActual] = useState<'dashboard' | 'presupuesto' | 'ahorros' | 'patrimonio' | 'prestamos' | 'configuracion'>('dashboard');

  const [mesSeleccionado] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const verificarSesion = async () => {
    setCargando(true);
    setErrorInicial(null);
    try {
      const perf = await obtenerPerfilUsuario();
      setPerfil(perf);
    } catch (err: any) {
      console.error('Error al verificar sesión:', err);
      setErrorInicial(err?.message || 'Fallo de conexión inicial');
      setPerfil(null);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    verificarSesion();
  }, []);

  const handleLogout = async () => {
    await cerrarSesion();
    setPerfil(null);
  };

  if (cargando) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white font-sans">
        <b className="text-base">⏳ Cargando Gestión Financiera...</b>
      </div>
    );
  }

  if (errorInicial) {
    return (
      <div className="p-10 text-center font-sans bg-slate-100 dark:bg-slate-900 min-h-screen">
        <h3 className="text-rose-500 font-bold text-lg mb-2">⚠️ No se pudo inicializar la aplicación</h3>
        <p className="text-slate-600 dark:text-slate-400 text-xs mb-4">{errorInicial}</p>
        <button
          onClick={verificarSesion}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!perfil) {
    return <AuthModal onSuccess={verificarSesion} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans">
      
      {/* Componente de Navegación Independiente */}
      <Navigation 
        vistaActual={seccionActual} 
        setVistaActual={setSeccionActual} 
        onLogout={handleLogout}
      />

      {/* Contenido Dinámico */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {seccionActual === 'dashboard' && (
          <Dashboard
            perfil={perfil}
            onLogout={handleLogout}
            onNavigate={(sec) => setSeccionActual(sec as any)}
          />
        )}

        {seccionActual === 'presupuesto' && (
          <Presupuesto
            familiaId={perfil.familia_id}
            mesSeleccionado={mesSeleccionado}
          />
        )}

        {seccionActual === 'ahorros' && (
          <Ahorros
            familiaId={perfil.familia_id}
            mesSeleccionado={mesSeleccionado}
          />
        )}

        {seccionActual === 'patrimonio' && (
          <Patrimonio
            familiaId={perfil.familia_id}
          />
        )}

        {seccionActual === 'prestamos' && (
          <Prestamos
            familiaId={perfil.familia_id}
          />
        )}

        {seccionActual === 'configuracion' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-lg font-extrabold mb-4">Configuración del Perfil y Grupo Familiar</h2>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <p>Usuario: <strong>{perfil?.nombre_usuario || perfil?.email}</strong></p>
              <p>Email: <strong>{perfil?.email}</strong></p>
              <p>
                Código de Invitación Familiar: <strong className="text-indigo-600 dark:text-indigo-400">{perfil?.familias?.codigo_invitacion || 'No asignado'}</strong>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
