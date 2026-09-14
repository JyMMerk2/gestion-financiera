import { useState, useEffect } from 'react';
import { AuthModal } from './components/AuthModal';
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
  const [seccionActual, setSeccionActual] = useState<'dashboard' | 'presupuesto' | 'ahorros' | 'patrimonio' | 'prestamos'>('dashboard');

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

  if (cargando) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', background: '#f3f4f6' }}>
        <b style={{ color: '#111827', fontSize: '16px' }}>⏳ Cargando Gestión Financiera...</b>
      </div>
    );
  }

  if (errorInicial) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif', background: '#f3f4f6', minHeight: '100vh' }}>
        <h3 style={{ color: '#ef4444' }}>⚠️ No se pudo inicializar la aplicación</h3>
        <p style={{ color: '#4b5563', fontSize: '13px' }}>{errorInicial}</p>
        <button
          onClick={verificarSesion}
          style={{ padding: '8px 16px', background: '#111827', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
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
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Barra de navegación superior */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '12px 20px', display: 'flex', gap: '8px', alignItems: 'center', overflowX: 'auto' }}>
        <button
          onClick={() => setSeccionActual('dashboard')}
          style={{ padding: '8px 14px', borderRadius: '9999px', border: '1px solid #e5e7eb', background: seccionActual === 'dashboard' ? '#111827' : '#f9fafb', color: seccionActual === 'dashboard' ? '#fff' : '#111827', fontWeight: '800', cursor: 'pointer', fontSize: '11px', whiteSpace: 'nowrap' }}
        >
          📌 Dashboard
        </button>
        <button
          onClick={() => setSeccionActual('presupuesto')}
          style={{ padding: '8px 14px', borderRadius: '9999px', border: '1px solid #e5e7eb', background: seccionActual === 'presupuesto' ? '#111827' : '#f9fafb', color: seccionActual === 'presupuesto' ? '#fff' : '#111827', fontWeight: '800', cursor: 'pointer', fontSize: '11px', whiteSpace: 'nowrap' }}
        >
          📊 Presupuesto
        </button>
        <button
          onClick={() => setSeccionActual('ahorros')}
          style={{ padding: '8px 14px', borderRadius: '9999px', border: '1px solid #e5e7eb', background: seccionActual === 'ahorros' ? '#111827' : '#f9fafb', color: seccionActual === 'ahorros' ? '#fff' : '#111827', fontWeight: '800', cursor: 'pointer', fontSize: '11px', whiteSpace: 'nowrap' }}
        >
          🏦 Ahorros
        </button>
        <button
          onClick={() => setSeccionActual('patrimonio')}
          style={{ padding: '8px 14px', borderRadius: '9999px', border: '1px solid #e5e7eb', background: seccionActual === 'patrimonio' ? '#111827' : '#f9fafb', color: seccionActual === 'patrimonio' ? '#fff' : '#111827', fontWeight: '800', cursor: 'pointer', fontSize: '11px', whiteSpace: 'nowrap' }}
        >
          💎 Patrimonio
        </button>
        <button
          onClick={() => setSeccionActual('prestamos')}
          style={{ padding: '8px 14px', borderRadius: '9999px', border: '1px solid #e5e7eb', background: seccionActual === 'prestamos' ? '#111827' : '#f9fafb', color: seccionActual === 'prestamos' ? '#fff' : '#111827', fontWeight: '800', cursor: 'pointer', fontSize: '11px', whiteSpace: 'nowrap' }}
        >
          💳 Préstamos
        </button>
      </div>

      {/* Contenido dinámico */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {seccionActual === 'dashboard' && (
          <Dashboard
            perfil={perfil}
            onLogout={async () => {
              await cerrarSesion();
              setPerfil(null);
            }}
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
      </div>
    </div>
  );
}
