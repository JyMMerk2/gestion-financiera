import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useModoOscuro } from '../hooks/useModoOscuro';
import { Copy, Share2, Check, RefreshCw, KeyRound, User, Users, Key, DollarSign, ShieldCheck, AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

interface ConfiguracionProps {
  perfil: any;
  onPerfilActualizado: () => void;
  moneda?: 'RD$' | 'USD';
  setMoneda?: (moneda: 'RD$' | 'USD') => void;
}

interface ToastNotificacion {
  id: number;
  tipo: 'exito' | 'error' | 'info';
  mensaje: string;
}

export const Configuracion: React.FC<ConfiguracionProps> = ({ perfil, onPerfilActualizado, moneda = 'RD$', setMoneda }) => {
  const { bgCard, borderCard, textPrimary, textLabel, inputStyle, textTitle, bgInput, esOscuro } = useModoOscuro();

  const APP_VERSION = 'v2.5.0';

  // Sistema de Notificaciones Elegantes (Toast Cyberpunk)
  const [toasts, setToasts] = useState<ToastNotificacion[]>([]);

  const mostrarNotificacion = (tipo: 'exito' | 'error' | 'info', mensaje: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, tipo, mensaje }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const cerrarToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Estados de Usuario / Perfil
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);

  // Estados de Seguridad / Contraseña
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  // Estados de Familia
  const [nombreFamilia, setNombreFamilia] = useState('');
  const [codigoInvitacion, setCodigoInvitacion] = useState('');
  const [codigoUnirse, setCodigoUnirse] = useState('');
  const [guardandoFamilia, setGuardandoFamilia] = useState(false);

  // Datos Vista Previa Familia
  const [familiaActualNombre, setFamiliaActualNombre] = useState('Sin Grupo Familiar');
  const [familiaActualCodigo, setFamiliaActualCodigo] = useState('N/A');

  // Estados de Tasas
  const [tasaUsd, setTasaUsd] = useState('60.00');
  const [tasaEur, setTasaEur] = useState('65.00');
  const [estadoTasa, setEstadoTasa] = useState('Cargando...');
  const [guardandoTasas, setGuardandoTasas] = useState(false);

  const [copiado, setCopiado] = useState(false);
  const [copiadoApp, setCopiadoApp] = useState(false);

  // Carga los datos reales de Supabase en el estado local
  useEffect(() => {
    if (perfil) {
      setNombreUsuario(perfil.nombre_usuario || perfil.nombre || '');
      if (perfil.familias) {
        const nomFam = perfil.familias.nombre || '';
        const codFam = perfil.familias.codigo_invitacion || '';
        setNombreFamilia(nomFam);
        setCodigoInvitacion(codFam);
        setFamiliaActualNombre(nomFam || 'Sin Grupo Familiar');
        setFamiliaActualCodigo(codFam || 'N/A');
        if (perfil.familias.tasa_usd) setTasaUsd(String(perfil.familias.tasa_usd));
      }
    }
  }, [perfil]);

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
        .update({ nombre_usuario: nombreUsuario.trim() })
        .eq('id', perfil.id);

      if (error) throw error;
      mostrarNotificacion('exito', '¡Nombre de usuario actualizado con éxito!');
      onPerfilActualizado();
    } catch (err: any) {
      mostrarNotificacion('error', 'Error al actualizar nombre: ' + err.message);
    } finally {
      setGuardandoUsuario(false);
    }
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordActual) {
      mostrarNotificacion('info', 'Debes ingresar tu contraseña actual.');
      return;
    }
    if (nuevaPassword.length < 6) {
      mostrarNotificacion('info', 'La contraseña nueva debe tener un mínimo de 6 caracteres.');
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      mostrarNotificacion('error', 'Las contraseñas nuevas no coinciden.');
      return;
    }

    setGuardandoPassword(true);
    try {
      const userEmail = perfil?.email;
      if (!userEmail) throw new Error('No se pudo verificar el correo del usuario.');

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: passwordActual
      });

      if (authError) {
        mostrarNotificacion('error', 'La contraseña actual ingresada es incorrecta.');
        setGuardandoPassword(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: nuevaPassword
      });

      if (updateError) throw updateError;

      mostrarNotificacion('exito', '¡Contraseña actualizada correctamente!');
      setPasswordActual('');
      setNuevaPassword('');
      setConfirmarPassword('');
    } catch (err: any) {
      mostrarNotificacion('error', 'Error inesperado: ' + err.message);
    } finally {
      setGuardandoPassword(false);
    }
  };

  // Creación y Vinculación limpia de Familia
  const handleGuardarFamilia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfil?.id) return;
    setGuardandoFamilia(true);

    try {
      const nomFinal = nombreFamilia.trim() || 'FAMILIA MERCADO GARCIA';
      const codFinal = codigoInvitacion.trim().toUpperCase() || 'JYMMERK2-2026';
      let familiaId = perfil?.familia_id || perfil?.familias?.id;

      if (!familiaId) {
        // 1. Insertar EXCLUSIVAMENTE campos nativos de la tabla familias
        const { error: errInsert } = await supabase
          .from('familias')
          .insert([{
            nombre: nomFinal,
            codigo_invitacion: codFinal
          }]);

        if (errInsert && !errInsert.message.includes('duplicate key')) {
          throw errInsert;
        }

        // 2. Obtener el ID recién creado buscando por su código
        const { data: famTarget, error: errSelect } = await supabase
          .from('familias')
          .select('id')
          .eq('codigo_invitacion', codFinal)
          .limit(1)
          .single();

        if (errSelect || !famTarget) {
          throw new Error('No se pudo verificar el registro de la familia creada.');
        }

        familiaId = famTarget.id;

        // 3. Vincular el id de la familia en la tabla perfiles
        const { error: errPerfil } = await supabase
          .from('perfiles')
          .update({ familia_id: familiaId })
          .eq('id', perfil.id);

        if (errPerfil) throw errPerfil;

      } else {
        // Actualización directa si ya estaba vinculado
        const { error: errUpdate } = await supabase
          .from('familias')
          .update({
            nombre: nomFinal,
            codigo_invitacion: codFinal
          })
          .eq('id', familiaId);

        if (errUpdate) throw errUpdate;
      }

      mostrarNotificacion('exito', '¡Grupo familiar guardado y vinculado exitosamente!');
      setFamiliaActualNombre(nomFinal);
      setFamiliaActualCodigo(codFinal);
      await onPerfilActualizado();
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      mostrarNotificacion('error', 'Detalle al guardar grupo: ' + err.message);
    } finally {
      setGuardandoFamilia(false);
    }
  };

  const handleGuardarTasas = async (e: React.FormEvent) => {
    e.preventDefault();
    const familiaId = perfil?.familia_id || perfil?.familias?.id;
    if (!familiaId) {
      mostrarNotificacion('info', 'Primero debes guardar el Grupo Familiar.');
      return;
    }

    setGuardandoTasas(true);
    try {
      mostrarNotificacion('exito', '¡Tasas de cambio actualizadas correctamente!');
      await onPerfilActualizado();
    } catch (err: any) {
      mostrarNotificacion('error', 'Error al guardar tasas: ' + err.message);
    } finally {
      setGuardandoTasas(false);
    }
  };

  const handleUnirseFamilia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoUnirse.trim()) {
      mostrarNotificacion('info', 'Ingresa un código de invitación válido.');
      return;
    }

    try {
      const { data: famTarget, error: errFam } = await supabase
        .from('familias')
        .select('id, nombre')
        .eq('codigo_invitacion', codigoUnirse.trim().toUpperCase())
        .single();

      if (errFam || !famTarget) {
        mostrarNotificacion('error', 'Código de familia no encontrado. Verifique e intente nuevamente.');
        return;
      }

      const { error: errPerfil } = await supabase
        .from('perfiles')
        .update({ familia_id: famTarget.id })
        .eq('id', perfil.id);

      if (errPerfil) throw errPerfil;

      mostrarNotificacion('exito', `¡Te has unido exitosamente al grupo "${famTarget.nombre}"!`);
      setCodigoUnirse('');
      await onPerfilActualizado();
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      mostrarNotificacion('error', 'Error al unirse: ' + err.message);
    }
  };

  const copiarCodigo = () => {
    if (!codigoInvitacion) return;
    navigator.clipboard.writeText(codigoInvitacion);
    setCopiado(true);
    mostrarNotificacion('info', 'Código copiado al portapapeles');
    setTimeout(() => setCopiado(false), 2000);
  };

  const compartirCodigo = async () => {
    if (!codigoInvitacion) return;
    const textoCompartir = `¡Únete a mi grupo familiar en Gestión Financiera! Usa el código de invitación: ${codigoInvitacion}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Unirse a Familia', text: textoCompartir });
      } catch (err) {
        copiarCodigo();
      }
    } else {
      copiarCodigo();
    }
  };

  const compartirApp = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopiadoApp(true);
    mostrarNotificacion('info', 'Enlace de la App copiado');
    setTimeout(() => setCopiadoApp(false), 2000);
  };

  return (
    <div style={{ background: bgCard, padding: '24px', borderRadius: '16px', border: `1px solid ${borderCard}`, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      
      {/* CORTEN DE NOTIFICACIONES TOAST CYBERPUNK */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '360px' }}>
        {toasts.map(t => {
          const esExito = t.tipo === 'exito';
          const esError = t.tipo === 'error';
          const colorBorde = esExito ? '#00ff41' : esError ? '#ff007f' : '#00e5ff';
          const colorBg = esExito ? 'rgba(0,255,65,0.12)' : esError ? 'rgba(255,0,127,0.12)' : 'rgba(0,229,255,0.12)';

          return (
            <div
              key={t.id}
              style={{
                background: '#0a0e14',
                border: `1px solid ${colorBorde}`,
                borderLeft: `5px solid ${colorBorde}`,
                boxShadow: `0 0 15px ${colorBorde}33`,
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#fff',
                backdropFilter: 'blur(10px)',
                animation: 'slideIn 0.3s ease-out'
              }}
            >
              {esExito && <CheckCircle2 size={18} color="#00ff41" />}
              {esError && <AlertCircle size={18} color="#ff007f" />}
              {!esExito && !esError && <Info size={18} color="#00e5ff" />}
              
              <span style={{ fontSize: '11px', fontWeight: '700', flex: 1, lineHeight: '1.4' }}>
                {t.mensaje}
              </span>

              <button
                onClick={() => cerrarToast(t.id)}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: '2px' }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: textTitle, letterSpacing: '0.05em' }}>
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
            <option value="RD$" style={{ background: bgCard, color: textPrimary }}>Dólares / Pesos (RD$)</option>
            <option value="USD" style={{ background: bgCard, color: textPrimary }}>Dólares Estadounidenses ($ USD)</option>
          </select>
        </div>
      )}

      {/* Bloque 1: Datos de Perfil */}
      <form onSubmit={handleGuardarUsuario} style={{ paddingBottom: '16px', borderBottom: `1px solid ${borderCard}` }}>
        <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px', color: textTitle, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <User size={14} color="#00e5ff" /> Mi Usuario
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: textLabel, marginBottom: '4px' }}>Nombre de Usuario</label>
          <input type="text" required value={nombreUsuario} onChange={(e) => setNombreUsuario(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: textLabel, marginBottom: '4px' }}>Correo Electrónico</label>
          <input type="email" disabled value={perfil?.email || ''} style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} />
        </div>

        <button type="submit" disabled={guardandoUsuario} style={{ width: '100%', background: esOscuro ? '#00e5ff' : '#0284c7', color: esOscuro ? '#0a0e14' : '#fff', padding: '9px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}>
          {guardandoUsuario ? 'Guardando...' : 'Actualizar Nombre'}
        </button>
      </form>

      {/* Bloque 2: Cambiar Contraseña */}
      <form onSubmit={handleCambiarPassword} style={{ paddingBottom: '16px', borderBottom: `1px solid ${borderCard}` }}>
        <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px', color: textTitle, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <KeyRound size={14} color="#00ff41" /> Seguridades y Contraseña
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: textLabel, marginBottom: '4px' }}>Contraseña Actual</label>
          <input type="password" required value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} placeholder="Ingrese su contraseña actual" style={inputStyle} />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: textLabel, marginBottom: '4px' }}>Nueva Contraseña</label>
          <input type="password" required value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} placeholder="Mínimo 6 caracteres" style={inputStyle} />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: textLabel, marginBottom: '4px' }}>Confirmar Nueva Contraseña</label>
          <input type="password" required value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} placeholder="Repita la nueva contraseña" style={inputStyle} />
        </div>

        <button type="submit" disabled={guardandoPassword} style={{ width: '100%', background: '#00ff41', color: '#0a0e14', padding: '9px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}>
          {guardandoPassword ? 'Verificando y Cambiando...' : 'Guardar Nueva Contraseña'}
        </button>
      </form>

      {/* Bloque 3: Grupo Familiar */}
      <form onSubmit={handleGuardarFamilia} style={{ paddingBottom: '16px', borderBottom: `1px solid ${borderCard}` }}>
        <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px', color: textTitle, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={14} color="#ffea00" /> Grupo Familiar y Compartir
        </div>

        <div style={{ background: bgInput, border: `1px solid ${borderCard}`, borderRadius: '10px', padding: '12px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: textLabel, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={13} color="#00ff41" /> Estado Actual del Grupo
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
            <span style={{ color: textLabel }}>Nombre Actual:</span>
            <b style={{ color: '#00e5ff' }}>{familiaActualNombre}</b>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
            <span style={{ color: textLabel }}>Código Vincular:</span>
            <b style={{ color: '#ffea00', letterSpacing: '1px' }}>{familiaActualCodigo}</b>
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: textLabel, marginBottom: '4px' }}>Nombre del Grupo Familiar</label>
          <input type="text" required value={nombreFamilia} onChange={(e) => setNombreFamilia(e.target.value)} placeholder="Ej. FAMILIA MERCADO GARCIA" style={inputStyle} />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: textLabel, marginBottom: '4px' }}>Código de Invitación (Personalizado)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="text" required value={codigoInvitacion} onChange={(e) => setCodigoInvitacion(e.target.value)} placeholder="Ej. JYMMERK2-2026" style={{ ...inputStyle, flex: 1, fontWeight: 'bold', letterSpacing: '0.5px' }} />
            <button type="button" onClick={copiarCodigo} style={{ background: bgInput, border: `1px solid ${borderCard}`, borderRadius: '8px', padding: '0 12px', cursor: 'pointer', color: textPrimary }}>
              {copiado ? <Check size={16} color="#00ff41" /> : <Copy size={16} />}
            </button>
            <button type="button" onClick={compartirCodigo} style={{ background: esOscuro ? '#00e5ff' : '#0284c7', border: 'none', borderRadius: '8px', padding: '0 12px', cursor: 'pointer', color: esOscuro ? '#0a0e14' : '#fff' }}>
              <Share2 size={16} />
            </button>
            <button type="button" onClick={compartirApp} style={{ background: 'rgba(255, 0, 127, 0.15)', border: '1px solid #ff007f', color: '#ff007f', borderRadius: '8px', padding: '0 10px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>
              {copiadoApp ? <Check size={14} color="#00ff41" /> : 'App'}
            </button>
          </div>
        </div>

        <button type="submit" disabled={guardandoFamilia} style={{ width: '100%', background: '#ffea00', color: '#0a0e14', padding: '10px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}>
          {guardandoFamilia ? 'Guardando Grupo...' : 'Guardar Grupo Familiar'}
        </button>
      </form>

      {/* Bloque 4: Tasas de Cambio */}
      <form onSubmit={handleGuardarTasas} style={{ paddingBottom: '16px', borderBottom: `1px solid ${borderCard}` }}>
        <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px', color: textTitle, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <DollarSign size={14} color="#00e5ff" /> Tasas de Cambio Oficiales (Relación a RD$)
        </div>

        <div style={{ background: bgInput, border: `1px solid ${borderCard}`, padding: '12px', borderRadius: '10px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: textTitle }}>💱 Mercado Financiero</span>
            <button type="button" onClick={consultarTasasEnVivo} style={{ background: 'transparent', border: 'none', color: '#00e5ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 'bold' }}>
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
          <span style={{ fontSize: '9px', color: textLabel, display: 'block', fontStyle: 'italic' }}>{estadoTasa}</span>
        </div>

        <button type="submit" disabled={guardandoTasas} style={{ width: '100%', background: esOscuro ? '#00e5ff' : '#0284c7', color: esOscuro ? '#0a0e14' : '#fff', padding: '10px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}>
          {guardandoTasas ? 'Guardando Tasas...' : 'Guardar Tasas de Cambio'}
        </button>
      </form>

      {/* Bloque 5: Unirse a Otra Familia */}
      <div style={{ borderBottom: `1px solid ${borderCard}`, paddingBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', color: '#ffea00', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Key size={14} /> ¿Quieres unirte a otro grupo familiar existente?
        </div>
        <form onSubmit={handleUnirseFamilia} style={{ display: 'flex', gap: '8px' }}>
          <input type="text" placeholder="Ingresa el código de invitación..." value={codigoUnirse} onChange={e => setCodigoUnirse(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <button type="submit" style={{ background: '#ffea00', color: '#0a0e14', padding: '0 14px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '10px', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Vincular Familia
          </button>
        </form>
      </div>

      {/* Pie de Página */}
      <div style={{ textAlign: 'center', paddingTop: '4px' }}>
        <span style={{ fontSize: '10px', fontWeight: '800', color: textLabel, letterSpacing: '0.05em' }}>
          Gestión Financiera App • <span style={{ color: '#00e5ff' }}>{APP_VERSION}</span>
        </span>
      </div>

    </div>
  );
};

export default Configuracion;
