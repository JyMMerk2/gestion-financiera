import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { FondoAhorro } from '../types';
import { useModoOscuro } from '../hooks/useModoOscuro';

interface AhorrosProps {
  familiaId: string;
}

export const Ahorros: React.FC<AhorrosProps> = ({ familiaId }) => {
  const { bgCard, borderCard, textPrimary, textLabel, inputStyle, textTitle, bgInput } = useModoOscuro();

  const [nombre, setNombre] = useState('');
  const [meta, setMeta] = useState('');
  const [actual, setActual] = useState('');
  const [fondos, setFondos] = useState<FondoAhorro[]>([]);
  const [cargando, setCargando] = useState(false);

  const cargarAhorros = async () => {
    if (!familiaId) return;
    const { data } = await supabase
      .from('ahorros')
      .select('*')
      .eq('familia_id', familiaId);

    if (data) setFondos(data);
  };

  useEffect(() => {
    cargarAhorros();
  }, [familiaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !meta) return;

    setCargando(true);
    try {
      await supabase.from('ahorros').insert([{
        familia_id: familiaId,
        nombre,
        meta: Number(meta),
        actual: Number(actual) || 0
      }]);

      setNombre('');
      setMeta('');
      setActual('');
      cargarAhorros();
    } catch (err: any) {
      alert('Error guardando ahorro: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const eliminarAhorro = async (id: string) => {
    if (!confirm('¿Eliminar esta meta de ahorro?')) return;
    await supabase.from('ahorros').delete().eq('id', id);
    cargarAhorros();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '14px' }}>
      {/* Formulario */}
      <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, transition: 'all 0.3s' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: textTitle }}>
          🐖 Metas y Fondos de Ahorro
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Nombre de la Meta / Fondo</label>
            <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Fondo de Emergencia, Viaje..." style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Monto Meta (RD$)</label>
              <input type="number" step="0.01" required value={meta} onChange={e => setMeta(e.target.value)} placeholder="0.00" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Monto Actual (RD$)</label>
              <input type="number" step="0.01" value={actual} onChange={e => setActual(e.target.value)} placeholder="0.00" style={inputStyle} />
            </div>
          </div>

          <button type="submit" disabled={cargando} style={{ width: '100%', background: '#10b981', color: '#fff', padding: '11px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '6px' }}>
            {cargando ? 'Guardando...' : 'Crear Meta de Ahorro'}
          </button>
        </form>
      </div>

      {/* Lista de Metas */}
      <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, transition: 'all 0.3s' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: textTitle }}>
          🎯 Progreso de Ahorros
        </div>
        <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {fondos.map((item) => {
            const porcentaje = Math.min(Math.round((item.actual / item.meta) * 100), 100);
            return (
              <div key={item.id} style={{ background: bgInput, border: `1px solid ${borderCard}`, borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <b style={{ fontSize: '12px' }}>{item.nombre}</b>
                  <button onClick={() => eliminarAhorro(item.id!)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '11px' }}>🗑️</button>
                </div>
                <div style={{ fontSize: '11px', color: textLabel, marginBottom: '6px' }}>
                  RD$ {Number(item.actual).toFixed(2)} de RD$ {Number(item.meta).toFixed(2)} ({porcentaje}%)
                </div>
                <div style={{ width: '100%', height: '8px', background: borderCard, borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${porcentaje}%`, height: '100%', background: '#10b981', transition: 'width 0.4s' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Ahorros;
