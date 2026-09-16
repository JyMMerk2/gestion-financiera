import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useModoOscuro } from '../hooks/useModoOscuro';
import { Copy, Share2, Check, RefreshCw, KeyRound, User } from 'lucide-react';

interface ConfiguracionProps {
  perfil: any;
  onPerfilActualizado: () => void;
  moneda?: 'RD$' | 'USD';
  setMoneda?: (moneda: 'RD$' | 'USD') => void;
}

export const Configuracion: React.FC<ConfiguracionProps> = ({ perfil, onPerfilActualizado, moneda = 'RD$', setMoneda }) => {
  const { bgCard, borderCard, textPrimary, textLabel, inputStyle, textTitle } = useModoOscuro();

  // Estados de Usuario / Perfil
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);

  // Estados de Seguridad / Contraseña
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  // Estados de Familia y Tasas
  const [nombreFamilia, setNombreFamilia] = useState('');
  const [codigoInvitacion, setCodigoInvitacion] = useState('');
  const [tasaUsd, setTasaUsd] = useState('60.00');
  const [tasaEur, setTasaEur] = useState('65.00');
  const [estadoTasa, setEstadoTasa] = useState('Cargando...');
  const [guardando, setGuardando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Carga los datos reales de Supabase en el estado local
  useEffect(() => {
    if (perfil) {
      setNombreUsuario(perfil.nombre_usuario || perfil.nombre || '');
      if (perfil.familias) {
        setNombreFamilia(perfil.familias.nombre || '');
        setCodigoInvitacion(perfil.familias.codigo_invitacion || '');
        if (perfil.familias.tasa_usd) setTasaUsd(String(perfil.familias.tasa_usd));
        if (perfil.familias.tasa_eur) setTasaEur(String(perfil.familias.tasa_eur));
      }
    }
  }, [perfil]);

  // Consulta tasas financieras en vivo desde API pública
  const consultarTasasEnVivo = async () => {
    setEstadoTasa('Consultando mercado...');
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();

      if (data && data.rates && data.rates.DOP) {
        const usdToDop = data.rates.DOP;
        const eurToUsd = data.rates.EUR;
        const eurToDop = usdToDop / eurToUsd;

        setTasaUsd(String(Number(usdToDop.toFixed(2))));
        setTasaEur(String(Number(eurToDop.toFixed(2))));
        
        const horaStr = new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
        setEstadoTasa(`🟢 Mercado en vivo (${horaStr})`);
        return;
      }
    } catch (err) {
      console.error('Error al obtener tasas:', err);
    }
    setEstadoTasa('⚠️ Tasa manual / Sin conexión');
  };

  useEffect(() => {
    consultarTasasEnVivo();
  }, []);

  const handleGuardarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfil?.id) return;

    setGuardandoUsuario(true);
    try {
      const { error } = await supabase
        .from('perfiles')
        .update({
          nombre_usuario: nombreUsuario.trim(),
          nombre: nombreUsuario.trim()
        })
        .eq('id', perfil.id);

      if (error) {
        alert('Error al actualizar nombre: ' + error.message);
      } else {
        alert('¡Nombre de usuario actualizado con éxito!');
        onPerfilActualizado();
      }
    } catch (err: any) {
      alert('Error inesperado: ' + err.message);
    } finally {
      setGuardandoUsuario(false);
    }
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaPassword) return;

    if (nuevaPassword.length < 6) {
      alert('La contraseña debe tener un mínimo de 6 caracteres.');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    setGuardandoPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: nuevaPassword
      });

      if (error) {
        alert('Error al cambiar contraseña: ' + error.message);
      } else {
        alert('¡Contraseña actualizada correctamente!');
        setNuevaPassword('');
        setConfirmarPassword('');
      }
    } catch (err: any) {
      alert('Error inesperado: ' + err.message);
    } finally {
      setGuardandoPassword(false);
    }
  };

  const handleGuardarFamilia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfil?.familia_id) {
      alert('No tienes un ID de familia asignado.');
      return;
    }

    setGuardando(true);
    try {
      const { error } = await supabase
        .from('familias')
        .update({
          nombre: nombreFamilia.trim(),
          codigo_invitacion: codigoInvitacion.trim().toUpperCase(),
          tasa_usd: Number(tasaUsd) || 60.00,
          tasa_eur: Number(tasaEur) || 65.00
        })
        .eq('id', perfil.familia_id);

      if (error) {
        alert('Error al actualizar la familia: ' + error.message);
      } else {
        alert('¡Configuración de familia y tasas actualizada correctamente!');
        await onPerfilActualizado();
      }
    } catch (err: any) {
      alert('Error inesperado: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const copiarCodigo = () => {
    if (!codigoInvitacion) return;
    navigator.clipboard.writeText(codigoInvitacion);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const compartirCodigo = async () => {
    if (!codigoInvitacion) return;
    const textoCompartir = `¡Únete a mi grupo familiar en Gestión Financiera! Usa el código de invitación: ${codigoInvitacion}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Unirse a Familia',
          text: textoCompartir,
        });
      } catch (err) {
        copiarCodigo();
      }
    } else {
      copiarCodigo();
    }
  };

  return (
    <div style={{ background: bgCard, padding: '24px', borderRadius: '16px', border: `1px solid ${borderCard}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: textTitle }}>
        ⚙️ Configuración del Perfil y Grupo Familiar
      </h2>

      {/* Selector de Moneda */}
      {setMoneda && (
        <div style={{ paddingBottom: '16px', borderBottom: `1px solid ${borderCard}` }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: textLabel, marginBottom: '6px' }}>
            💱 Moneda Principal del Sistema
          </label>
          <select
            value={moneda}
            onChange={(e) => setMoneda(e.target.value as 'RD$' | 'USD')}
            style={{ ...inputStyle, fontWeight: 'bold' }}
          >
            <option value="RD$">Dólares / Pesos (RD$)</option>
            <option value="USD">Dólares Estadounidenses ($ USD)</option>
          </select>
        </div>
      )}

      {/* Bloque 1: Datos de Perfil y Nombre */}
      <form onSubmit={handleGuardarUsuario} style={{ paddingBottom: '16px', borderBottom: `1px solid ${borderCard}` }}>
        <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px', color: textTitle, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <User size={14} /> Mi Usuario
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: textLabel, marginBottom: '4px' }}>
            Nombre de Usuario
          </label>
          <input
            type="text"
            required
            value={nombreUsuario}
            onChange={(e) => setNombreUsuario(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: textLabel, marginBottom: '4px' }}>
            Correo Electrónico
          </label>
          <input
            type="email"
            disabled
            value={perfil?.email || ''}
            style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }}
          />
        </div>

        <button
          type="submit"
          disabled={guardandoUsuario}
          style={{ width: '100%', background: '#0284c7', color: '#fff', padding: '9px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}
        >
          {guardandoUsuario ? 'Guardando...' : 'Actualizar Nombre'}
        </button>
      </form>

      {/* Bloque 2: Cambiar Contraseña */}
      <form onSubmit={handleCambiarPassword} style={{ paddingBottom: '16px', borderBottom: `1px solid ${borderCard}` }}>
        <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px', color: textTitle, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <KeyRound size={14} /> Seguridades y Contraseña
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: textLabel, marginBottom: '4px' }}>
            Nueva Contraseña
          </label>
          <input
            type="password"
            required
            value={nuevaPassword}
            onChange={(e) => setNuevaPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: textLabel, marginBottom: '4px' }}>
            Confirmar Nueva Contraseña
          </label>
          <input
            type="password"
            required
            value={confirmarPassword}
            onChange={(e) => setConfirmarPassword(e.target.value)}
            placeholder="Repita la nueva contraseña"
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={guardandoPassword}
          style={{ width: '100%', background: '#10b981', color: '#fff', padding: '9px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}
        >
          {guardandoPassword ? 'Cambiando...' : 'Guardar Nueva Contraseña'}
        </button>
      </form>

      {/* Bloque 3: Formulario de Grupo Familiar y Tasas */}
      <form onSubmit={handleGuardarFamilia}>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: textLabel, marginBottom: '4px' }}>
            Nombre del Grupo Familiar
          </label>
          <input
            type="text"
            required
            value={nombreFamilia}
            onChange={(e) => setNombreFamilia(e.target.value)}
            placeholder="Ej. Familia JYMMERK2"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: textLabel, marginBottom: '4px' }}>
            Código de Invitación (Personalizado)
          </label>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              required
              value={codigoInvitacion}
              onChange={(e) => setCodigoInvitacion(e.target.value)}
              placeholder="Ej. JYMMERK2-2026"
              style={{ ...inputStyle, flex: 1, fontWeight: 'bold', letterSpacing: '0.5px' }}
            />

            <button
              type="button"
              onClick={copiarCodigo}
              title="Copiar Código"
              style={{ background: borderCard, border: 'none', borderRadius: '8px', padding: '0 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textPrimary }}
            >
              {copiado ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            </button>

            <button
              type="button"
              onClick={compartirCodigo}
              title="Compartir Código"
              style={{ background: '#0284c7', border: 'none', borderRadius: '8px', padding: '0 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}
            >
              <Share2 size={16} />
            </button>
          </div>

          <span style={{ fontSize: '10px', color: textLabel, marginTop: '6px', display: 'block' }}>
            Comparte este código para permitir que otros integrantes se unan a tu grupo familiar.
          </span>
        </div>

        {/* Panel de Tasas de Cambio Automáticas / Editables */}
        <div style={{ background: borderCard, padding: '12px', borderRadius: '10px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: textTitle }}>
              💱 Tasas de Cambio Oficiales (Relación a RD$)
            </span>
            <button
              type="button"
              onClick={consultarTasasEnVivo}
              style={{ background: 'transparent', border: 'none', color: '#0284c7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 'bold' }}
            >
              <RefreshCw size={12} /> Actualizar
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '6px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>💵 1 USD = RD$</label>
              <input type="number" step="0.01" value={tasaUsd} onChange={(e) => setTasaUsd(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>💶 1 EUR = RD$</label>
              <input type="number" step="0.01" value={tasaEur} onChange={(e) => setTasaEur(e.target.value)} style={inputStyle} />
            </div>
          </div>
          
          <span style={{ fontSize: '9px', color: textLabel, display: 'block', fontStyle: 'italic' }}>
            {estadoTasa}
          </span>
        </div>

        <button
          type="submit"
          disabled={guardando}
          style={{
            width: '100%',
            background: '#0284c7',
            color: '#fff',
            padding: '11px',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '800',
            fontSize: '11px',
            textTransform: 'uppercase',
            cursor: 'pointer'
          }}
        >
          {guardando ? 'Guardando Cambios...' : 'Guardar Datos y Tasas'}
        </button>
      </form>
    </div>
  );
};

export default Configuracion;
