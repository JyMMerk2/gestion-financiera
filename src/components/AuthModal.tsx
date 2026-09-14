import React, { useState } from 'react';
import { iniciarSesion, registrarUsuario } from '../services/auth';

interface AuthModalProps {
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [modo, setModo] = useState<'LOGIN' | 'REGISTRO'>('LOGIN');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [codigoInvitacion, setCodigoInvitacion] = useState('');
  
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'success'; texto: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    setCargando(true);

    try {
      if (modo === 'LOGIN') {
        await iniciarSesion(email, pass);
        onSuccess();
      } else {
        if (pass !== passConfirm) {
          throw new Error('Las contraseñas no coinciden.');
        }
        await registrarUsuario(email, pass, nombreUsuario, codigoInvitacion);
        setMensaje({ tipo: 'success', texto: '¡Registro exitoso! Iniciando sesión...' });
        setTimeout(() => onSuccess(), 1000);
      }
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Ocurrió un error en la autenticación' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: '#ffffff', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '420px',
        boxShadow: '0 15px 35px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '900', marginBottom: '20px', textTransform: 'uppercase', color: '#111827' }}>
          {modo === 'LOGIN' ? 'Iniciar Sesión' : 'Registro Familiar'}
        </div>

        <form onSubmit={handleSubmit}>
          {modo === 'REGISTRO' && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase' }}>Nombre Completo</label>
              <input
                type="text" required value={nombreUsuario} onChange={e => setNombreUsuario(e.target.value)}
                placeholder="Ej. Juan Mercado"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '13px', outline: 'none' }}
              />
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase' }}>Correo Electrónico</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '13px', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase' }}>Contraseña</label>
            <input
              type="password" required value={pass} onChange={e => setPass(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '13px', outline: 'none' }}
            />
          </div>

          {modo === 'REGISTRO' && (
            <>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase' }}>Confirmar Contraseña</label>
                <input
                  type="password" required value={passConfirm} onChange={e => setPassConfirm(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#4f46e5', marginBottom: '4px', textTransform: 'uppercase' }}>Código de Invitación Familiar (Opcional)</label>
                <input
                  type="text" value={codigoInvitacion} onChange={e => setCodigoInvitacion(e.target.value.toUpperCase())}
                  placeholder="Ej. FAM-7A9B (Déjalo vacío si creas una economía nueva)"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #4f46e5', background: 'rgba(79, 70, 229, 0.05)', fontSize: '12px', outline: 'none' }}
                />
              </div>
            </>
          )}

          <button
            type="submit" disabled={cargando}
            style={{
              width: '100%', padding: '14px', background: modo === 'LOGIN' ? '#111827' : '#10b981', color: '#ffffff',
              border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '10px'
            }}
          >
            {cargando ? 'Procesando...' : (modo === 'LOGIN' ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </button>
        </form>

        {mensaje && (
          <div style={{
            marginTop: '15px', padding: '10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', textAlign: 'center',
            background: mensaje.tipo === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            color: mensaje.tipo === 'error' ? '#ef4444' : '#10b981'
          }}>
            {mensaje.texto}
          </div>
        )}

        <div style={{ marginTop: '20px', textAlign: 'left' }}>
          {modo === 'LOGIN' ? (
            <span style={{ fontSize: '11px', color: '#6b7280', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setModo('REGISTRO')}>
              ¿No tienes cuenta? Registra a tu familia aquí
            </span>
          ) : (
            <span style={{ fontSize: '11px', color: '#6b7280', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setModo('LOGIN')}>
              Volver al inicio de sesión
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
