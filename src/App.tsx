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
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#ffffff', fontFamily: 'sans-serif' }}>
        <b style={{ fontSize: '16px' }}>⏳ Cargando Gestión Financiera...</b>
      </div>
    );
  }

  if (errorInicial) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
        <h3 style={{ color: '#ef4444', fontWeight: 'bold' }}>⚠️ No se pudo inicializar la aplicación</h3>
        <p style={{ color: '#64748b', fontSize: '13px' }}>{errorInicial}</p>
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

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Navegación independiente */}
      <Navigation 
        vistaActual={seccionActual} 
        setVistaActual={setSeccionActual} 
        onLogout={handleLogout}
      />

      {/* Contenido Dinámico */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
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
          <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: '#0f172a' }}>Configuración del Perfil y Grupo Familiar</h2>
            <div style={{ fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p>Usuario: <strong>{perfil?.nombre_usuario || perfil?.email}</strong></p>
              <p>Email: <strong>{perfil?.email}</strong></p>
              <p>
                Código de Invitación Familiar: <strong style={{ color: '#4f46e5' }}>{perfil?.familias?.codigo_invitacion || 'No asignado'}</strong>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
