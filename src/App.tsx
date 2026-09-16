import { useState, useEffect } from 'react';
import { AuthModal } from './components/AuthModal';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { Presupuesto } from './components/Presupuesto';
import { Ahorros } from './components/Ahorros';
import { Patrimonio } from './components/Patrimonio';
import Prestamos from './components/Prestamos';
import Metas from './components/Metas';
import { Configuracion } from './components/Configuracion';
import { obtenerPerfilUsuario, cerrarSesion } from './services/auth';

export default function App() {
  const [perfil, setPerfil] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [errorInicial, setErrorInicial] = useState<string | null>(null);
  const [seccionActual, setSeccionActual] = useState<'dashboard' | 'presupuesto' | 'ahorros' | 'patrimonio' | 'prestamos' | 'metas' | 'configuracion'>('dashboard');

  const [modoOscuro, setModoOscuro] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (modoOscuro) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0b0f19';
      document.body.style.color = '#f1f5f9';
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.color = '#0f172a';
      localStorage.setItem('theme', 'light');
    }
  }, [modoOscuro]);

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
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', color: '#ffffff', fontFamily: 'sans-serif' }}>
        <b style={{ fontSize: '16px' }}>⏳ Cargando Gestión Financiera...</b>
      </div>
    );
  }

  if (errorInicial) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif', background: modoOscuro ? '#0b0f19' : '#f8fafc', minHeight: '100vh', color: modoOscuro ? '#fff' : '#000' }}>
        <h3 style={{ color: '#ef4444', fontWeight: 'bold' }}>⚠️ No se pudo inicializar la aplicación</h3>
        <p style={{ color: modoOscuro ? '#94a3b8' : '#64748b', fontSize: '13px' }}>{errorInicial}</p>
        <button
          onClick={verificarSesion}
          style={{ padding: '10px 20px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '12px' }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!perfil) {
    return <AuthModal onSuccess={verificarSesion} />;
  }

  // Extraer el identificador de la familia asegurando un respaldo seguro
  const familiaIdSegura = perfil?.familia_id || perfil?.familias?.id || 'general';

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: modoOscuro ? '#0b0f19' : '#f8fafc', 
      color: modoOscuro ? '#f1f5f9' : '#0f172a',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      transition: 'all 0.2s ease'
    }}>
      
      <Navigation 
        vistaActual={seccionActual} 
        setVistaActual={setSeccionActual} 
        onLogout={handleLogout}
        modoOscuro={modoOscuro}
        setModoOscuro={setModoOscuro}
      />

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
        {seccionActual === 'dashboard' && (
          <Dashboard
            perfil={perfil}
            onLogout={handleLogout}
            onNavigate={(sec) => setSeccionActual(sec as any)}
            modoOscuro={modoOscuro}
          />
        )}

        {seccionActual === 'presupuesto' && (
          <Presupuesto
            familiaId={familiaIdSegura}
            mesSeleccionado={mesSeleccionado}
          />
        )}

        {seccionActual === 'ahorros' && (
          <Ahorros
            familiaId={familiaIdSegura}
            mesSeleccionado={mesSeleccionado}
          />
        )}

        {seccionActual === 'patrimonio' && (
          <Patrimonio
            familiaId={familiaIdSegura}
          />
        )}

        {seccionActual === 'prestamos' && (
          <Prestamos
            familiaId={familiaIdSegura}
          />
        )}

        {seccionActual === 'metas' && (
          <Metas
            familiaId={familiaIdSegura}
          />
        )}

        {seccionActual === 'configuracion' && (
          <Configuracion 
            perfil={perfil} 
            onPerfilActualizado={verificarSesion} 
          />
        )}
      </main>
    </div>
  );
}
