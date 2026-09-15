import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { TransaccionPresupuesto, TipoTransaccion } from '../types';

interface PresupuestoProps {
  familiaId: string;
  mesSeleccionado: string;
}

export const Presupuesto: React.FC<PresupuestoProps> = ({ familiaId, mesSeleccionado }) => {
  const [tipo, setTipo] = useState<TipoTransaccion>('Gasto');
  const [categoria, setCategoria] = useState('');
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [wallet, setWallet] = useState('💵 Efectivo');
  const [moneda, setMoneda] = useState<'DOP' | 'USD' | 'EUR'>('DOP');
  const [tasaCambio, setTasaCambio] = useState('1');
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

    if (data) {
      setTransacciones(data.filter((row: TransaccionPresupuesto) => row.fecha.startsWith(mesSeleccionado)));
    }
  };

  useEffect(() => {
    cargarTransacciones();
  }, [familiaId, mesSeleccionado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto || Number(monto) <= 0) return;

    setCargando(true);
    const montoOrigNum = Number(monto);
    const tasaNum = Number(tasaCambio) || 1;
    const montoDOPNum = moneda === 'DOP' ? montoOrigNum : montoOrigNum * tasaNum;

    let conceptoFinal = concepto.trim();
    if (moneda === 'USD') {
      conceptoFinal = `[USD $${montoOrigNum.toFixed(2)} @ ${tasaNum.toFixed(2)}] ${conceptoFinal}`;
    } else if (moneda === 'EUR') {
      conceptoFinal = `[EUR €${montoOrigNum.toFixed(2)} @ ${tasaNum.toFixed(2)}] ${conceptoFinal}`;
    }

    try {
      await supabase.from('presupuesto').insert([{
        familia_id: familiaId,
        fecha,
        tipo,
        categoria: categoria || 'General',
        concepto: conceptoFinal,
        monto_dop: montoDOPNum,
        monto_original: montoOrigNum,
        moneda,
        tasa_cambio: tasaNum,
        wallet
      }]);

      setMonto('');
      setConcepto('');
      cargarTransacciones();
    } catch (err: any) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const eliminarRegistro = async (id: string) => {
    if (!confirm('¿Deseas eliminar este registro?')) return;
    await supabase.from('presupuesto').delete().eq('id', id);
    cargarTransacciones();
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '14px' }}>
        {/* Formulario */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', color: '#f8fafc' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid #334155', paddingBottom: '6px', color: '#38bdf8' }}>
            ✍️ Registrar Ingreso o Gasto
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#94a3b8', marginBottom: '3px' }}>Tipo</label>
                <select value={tipo} onChange={e => setTipo(e.target.value as TipoTransaccion)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', outline: 'none' }}>
                  <option value="Ingreso">Ingreso (+)</option>
                  <option value="Gasto">Gasto (-)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#94a3b8', marginBottom: '3px' }}>Moneda</label>
                <select value={moneda} onChange={e => {
                  const m = e.target.value as any;
                  setMoneda(m);
                  if (m === 'USD') setTasaCambio('57.75');
                  else if (m === 'EUR') setTasaCambio('68.48');
                  else setTasaCambio('1');
                }} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', outline: 'none' }}>
                  <option value="DOP">DOP (RD$)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#94a3b8', marginBottom: '3px' }}>Monto</label>
                <input type="number" step="0.01" required value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', outline: 'none' }} />
              </div>
              {moneda !== 'DOP' && (
                <div>
                  <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#94a3b8', marginBottom: '3px' }}>Tasa Cambio (RD$)</label>
                  <input type="number" step="0.01" value={tasaCambio} onChange={e => setTasaCambio(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', outline: 'none' }} />
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#94a3b8', marginBottom: '3px' }}>Wallet / Cuenta</label>
                <select value={wallet} onChange={e => setWallet(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', outline: 'none' }}>
                  <option value="💵 Efectivo">💵 Efectivo</option>
                  <option value="🏦 Banreservas">🏦 Banreservas</option>
                  <option value="🔵 Banco Popular">🔵 Banco Popular</option>
                  <option value="🏢 Banco BHD">🏢 Banco BHD</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#94a3b8', marginBottom: '3px' }}>Categoría</label>
                <input type="text" value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Ej. Supermercado, Sueldo..." style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#94a3b8', marginBottom: '3px' }}>Fecha</label>
                <input type="date" required value={fecha} onChange={e => setFecha(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#94a3b8', marginBottom: '3px' }}>Concepto</label>
                <input type="text" required value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Ej. Compra semanal..." style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', outline: 'none' }} />
              </div>
            </div>

            <button type="submit" disabled={cargando} style={{ width: '100%', background: '#10b981', color: '#fff', padding: '11px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '6px' }}>
              {cargando ? 'Guardando...' : 'Guardar Transacción'}
            </button>
          </form>
        </div>

        {/* Tabla Historial */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', color: '#f8fafc' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid #334155', paddingBottom: '6px', color: '#38bdf8' }}>
            📜 Historial Presupuesto
          </div>
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#0f172a', textTransform: 'uppercase', borderBottom: '1px solid #334155', textAlign: 'left', color: '#94a3b8' }}>
                  <th style={{ padding: '8px' }}>Fecha</th>
                  <th style={{ padding: '8px' }}>Wallet</th>
                  <th style={{ padding: '8px' }}>Tipo / Cat</th>
                  <th style={{ padding: '8px' }}>Total RD$</th>
                  <th style={{ padding: '8px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {transacciones.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '8px', color: '#cbd5e1' }}>{row.fecha}</td>
                    <td style={{ padding: '8px', color: '#f8fafc' }}><b>{row.wallet}</b></td>
                    <td style={{ padding: '8px', color: '#cbd5e1' }}>{row.tipo} / {row.categoria}</td>
                    <td style={{ padding: '8px', color: row.tipo === 'Ingreso' ? '#34d399' : '#f87171', fontWeight: 'bold' }}>
                      RD$ {Number(row.monto_dop).toFixed(2)}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <button onClick={() => eliminarRegistro(row.id!)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}>
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
    </div>
  );
};
