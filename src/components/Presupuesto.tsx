import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { TransaccionPresupuesto, TipoTransaccion } from '../types';
import { useModoOscuro } from '../hooks/useModoOscuro';

interface PresupuestoProps {
  familiaId: string;
}

export const Presupuesto: React.FC<PresupuestoProps> = ({ familiaId }) => {
  const { bgCard, borderCard, textPrimary, textLabel, inputStyle, textTitle, bgInput } = useModoOscuro();

  const [tipo, setTipo] = useState<TipoTransaccion>('Gasto');
  const [categoria, setCategoria] = useState('');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [transacciones, setTransacciones] = useState<TransaccionPresupuesto[]>([]);
  const [cargando, setCargando] = useState(false);

  const cargarTransacciones = async () => {
    if (!familiaId) return;
    const { data } = await supabase
      .from('presupuesto')
      .select('*')
      .eq('familia_id', familiaId)
      .order('fecha', { ascending: false });

    if (data) setTransacciones(data);
  };

  useEffect(() => {
    cargarTransacciones();
  }, [familiaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto || Number(monto) <= 0 || !categoria) return;

    setCargando(true);
    try {
      await supabase.from('presupuesto').insert([{
        familia_id: familiaId,
        fecha,
        tipo,
        categoria,
        monto: Number(monto),
        descripcion
      }]);

      setCategoria('');
      setMonto('');
      setDescripcion('');
      cargarTransacciones();
    } catch (err: any) {
      alert('Error guardando transacción: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const eliminarTransaccion = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return;
    await supabase.from('presupuesto').delete().eq('id', id);
    cargarTransacciones();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '14px' }}>
      {/* Formulario */}
      <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, transition: 'all 0.3s' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: textTitle }}>
          📊 Gestión de Presupuesto
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value as TipoTransaccion)} style={inputStyle}>
                <option value="Gasto" style={{ background: bgCard, color: textPrimary }}>Gasto (-)</option>
                <option value="Ingreso" style={{ background: bgCard, color: textPrimary }}>Ingreso (+)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Categoría</label>
              <input type="text" required value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Ej. Comida, Alquiler..." style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Monto (RD$)</label>
              <input type="number" step="0.01" required value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Fecha</label>
              <input type="date" required value={fecha} onChange={e => setFecha(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Descripción / Detalle</label>
            <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Ej. Compra de supermercado" style={inputStyle} />
          </div>

          <button type="submit" disabled={cargando} style={{ width: '100%', background: '#3b82f6', color: '#fff', padding: '11px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '6px' }}>
            {cargando ? 'Guardando...' : 'Registrar Transacción'}
          </button>
        </form>
      </div>

      {/* Tabla */}
      <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, transition: 'all 0.3s' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: textTitle }}>
          📜 Registro de Movimientos
        </div>
        <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: bgInput, textTransform: 'uppercase', borderBottom: `1px solid ${borderCard}`, textAlign: 'left', color: textLabel }}>
                <th style={{ padding: '8px' }}>Fecha</th>
                <th style={{ padding: '8px' }}>Categoría</th>
                <th style={{ padding: '8px' }}>Tipo</th>
                <th style={{ padding: '8px' }}>Monto (RD$)</th>
                <th style={{ padding: '8px' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {transacciones.map((row) => (
                <tr key={row.id} style={{ borderBottom: `1px solid ${borderCard}` }}>
                  <td style={{ padding: '8px', color: textLabel }}>{row.fecha}</td>
                  <td style={{ padding: '8px' }}><b>{row.categoria}</b></td>
                  <td style={{ padding: '8px', color: row.tipo === 'Ingreso' ? '#10b981' : '#ef4444' }}>{row.tipo}</td>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>
                    RD$ {Number(row.monto).toFixed(2)}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <button onClick={() => eliminarTransaccion(row.id!)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Presupuesto;
