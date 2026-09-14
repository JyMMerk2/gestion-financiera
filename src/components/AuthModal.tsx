import React, { useState, useEffect } from 'react';
import { iniciarSesion, registrarUsuario } from '../services/auth';

// Importación directa de imágenes desde la carpeta img
import fondo1 from '../../img/fondo1.jfif';
import fondo2 from '../../img/fondo2.jfif';
import fondo3 from '../../img/fondo3.jfif';
import fondo4 from '../../img/fondo4.jfif';

interface AuthModalProps {
  onSuccess: () => void;
}

const SLIDES = [
  {
    imagen: fondo1,
    titulo: 'Controla tus Finanzas',
    descripcion: 'Gestiona ingresos, gastos y presupuestos de forma organizada.'
  },
  {
    imagen: fondo2,
    titulo: 'Planificación Inteligente',
    descripcion: 'Visualiza métricas en tiempo real sobre la economía familiar.'
  },
  {
    imagen: fondo3,
    titulo: 'Acceso Multi-Moneda',
    descripcion: 'Monitorea tus cuentas en múltiples divisas desde cualquier lugar.'
  },
  {
    imagen: fondo4,
    titulo: 'Haz Crecer tu Patrimonio',
    descripcion: 'Registra tus ahorros, inversiones y metas a futuro.'
  }
];

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [modo, setModo] = useState<'LOGIN' | 'REGISTRO'>('LOGIN');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [codigoInvitacion, setCodigoInvitacion] = useState('');

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'success'; texto: string } | null>(null);

  const [slideActual, setSlideActual] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideActual((prev) => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

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
      background: '#0b0e14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: '#ffffff', borderRadius: '24px', overflow: 'hidden',
        width: '100%', maxWidth: '850px', display: 'flex', minHeight: '520px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e5e7eb'
      }}>

        {/* Panel Izquierdo: Slider de imágenes con frases */}
        <div style={{
          flex: '1', position: 'relative', display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end', padding: '30px', color: '#ffffff', overflow: 'hidden'
        }}>
          {SLIDES.map((slide, idx) => (
            <img
              key={idx}
              src={slide.imagen}
              alt={slide.titulo}
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center',
                opacity: idx === slideActual ? 1 : 0,
                transition: 'opacity 1s ease-in-out',
                zIndex: 1
              }}
            />
          ))}

          {/* Capa de degradado oscuro sobre la imagen */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.3) 100%)',
            zIndex: 2
          }} />

          {/* Textos e indicadores del slider */}
          <div style={{ position: 'relative', zIndex: 3 }}>
            <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px', color: '#ffffff' }}>
              {SLIDES[slideActual].titulo}
            </h3>
            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.4', marginBottom: '16px' }}>
              {SLIDES[slideActual].descripcion}
            </p>

            {/* Puntos de navegación */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {SLIDES.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setSlideActual(idx)}
                  style={{
                    width: idx === slideActual ? '24px' : '8px',
                    height: '8px', borderRadius: '4px',
                    background: idx === slideActual ? '#38bdf8' : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer', transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Panel Derecho: Formulario */}
        <div style={{
          width: '100%', maxWidth: '400px', padding: '36px 32px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#ffffff'
        }}>
          <div style={{ fontSize: '18px', fontWeight: '900', marginBottom: '20px', textTransform: 'uppercase', color: '#111827' }}>
            {modo === 'LOGIN' ? 'Iniciar Sesión' : 'Registro Familiar'}
          </div>

          <form onSubmit={handleSubmit}>
            {modo === 'REGISTRO' && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase' }}>Nombre Completo</label>
                <input
                  type="text" required value={nombreUsuario} onChange={e => setNombreUsuario(e.target.value)}
                  placeholder="Ej. Juan Mercado"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '13px', outline: 'none' }}
                />
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase' }}>Correo Electrónico</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '13px', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase' }}>Contraseña</label>
              <input
                type="password" required value={pass} onChange={e => setPass(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '13px', outline: 'none' }}
              />
            </div>

            {modo === 'REGISTRO' && (
              <>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase' }}>Confirmar Contraseña</label>
                  <input
                    type="password" required value={passConfirm} onChange={e => setPassConfirm(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#4f46e5', marginBottom: '4px', textTransform: 'uppercase' }}>Código de Invitación (Opcional)</label>
                  <input
                    type="text" value={codigoInvitacion} onChange={e => setCodigoInvitacion(e.target.value.toUpperCase())}
                    placeholder="Ej. FAM-7A9B (Déjalo vacío si creas un grupo nuevo)"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #4f46e5', background: 'rgba(79, 70, 229, 0.05)', fontSize: '11px', outline: 'none' }}
                  />
                </div>
              </>
            )}

            <button
              type="submit" disabled={cargando}
              style={{
                width: '100%', padding: '12px', background: modo === 'LOGIN' ? '#111827' : '#10b981', color: '#ffffff',
                border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '8px'
              }}
            >
              {cargando ? 'Procesando...' : (modo === 'LOGIN' ? 'Iniciar Sesión' : 'Crear Cuenta')}
            </button>
          </form>

          {mensaje && (
            <div style={{
              marginTop: '12px', padding: '10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', textAlign: 'center',
              background: mensaje.tipo === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              color: mensaje.tipo === 'error' ? '#ef4444' : '#10b981'
            }}>
              {mensaje.texto}
            </div>
          )}

          <div style={{ marginTop: '16px', textAlign: 'left' }}>
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
    </div>
  );
};
