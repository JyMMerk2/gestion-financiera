import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useModoOscuro } from '../hooks/useModoOscuro';
import { Copy, Share2, Check } from 'lucide-react';

interface ConfiguracionProps {
  perfil: any;
  onPerfilActualizado: () => void;
  moneda?: 'RD$' | 'USD';
  setMoneda?: (moneda: 'RD$' | 'USD') => void;
}

export const Configuracion: React.FC<ConfiguracionProps> = ({ perfil, onPerfilActualizado, moneda = 'RD$', setMoneda }) => {
  const { bgCard, borderCard, textPrimary, textLabel, inputStyle, textTitle } = useModoOscuro();

  const [nombreFamilia, setNombreFamilia] = useState('');
  const [codigoInvitacion, setCodigoInvitacion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Carga los datos reales de Supabase en el estado local
  useEffect(() => {
    if (perfil?.familias) {
      setNombreFamilia(perfil.familias.nombre || '');
      setCodigoInvitacion(perfil.familias.codigo_invitacion || '');
    }
  }, [perfil]);

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
          codigo_invitacion: codigoInvitacion.trim().toUpperCase()
        })
        .eq('id', perfil.familia_id);

      if (error) {
        alert('Error al actualizar la familia: ' + error.message);
      } else {
        alert('¡Configuración de familia actualizada correctamente!');
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
    <div style={{ background: bgCard, padding: '24px', borderRadius: '16px', border: `1px solid ${borderCard}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: textTitle }}>
        ⚙️ Configuración del Perfil y Grupo Familiar
      </h2>

      {/* Selector de Moneda */}
      {setMoneda && (
        <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: `1px solid ${borderCard}` }}>
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

      {/* Datos Personales */}
      <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: `1px solid ${borderCard}`, fontSize: '13px', color: textPrimary, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <p><strong>Usuario:</strong> {perfil?.nombre_usuario || perfil?.email}</p>
        <p><strong>Email:</strong> {perfil?.email}</p>
        <p><strong>ID de Familia:</strong> <code style={{ background: borderCard, padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>{perfil?.familia_id || 'Sin ID'}</code></p>
      </div>

      {/* Formulario de Grupo Familiar */}
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
          {guardando ? 'Guardando Cambios...' : 'Guardar Datos de Familia'}
        </button>
      </form>
    </div>
  );
};

export default Configuracion;
