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
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 shadow-sm backdrop-blur-md transition-colors duration-300" style={{ borderRadius: '14px', padding: '16px' }}>
          <div className="text-emerald-600 dark:text-sky-400 border-b border-slate-200 dark:border-slate-700/80" style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', paddingBottom: '6px' }}>
            ✍️ Registrar Ingreso o Gasto
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label className="text-slate-500 dark:text-slate-400" style={{ display: 'block', fontSize: '9px', fontWeight: '800', marginBottom: '3px' }}>Tipo</label>
                <select 
                  value={tipo} 
                  onChange={e => setTipo(e.target.value as TipoTransaccion)} 
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', outline: 'none' }}
                >
                  <option value="Ingreso">Ingreso (+)</option>
                  <option value="Gasto">Gasto (-)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-500 dark:text-slate-400" style={{ display: 'block', fontSize: '9px', fontWeight: '800', marginBottom: '3px' }}>Moneda</label>
                <select 
                  value={moneda} 
                  onChange={e => {
                    const m = e.target.value as any;
                    setMoneda(m);
                    if (m === 'USD') setTasaCambio('57.75');
                    else if (m === 'EUR') setTasaCambio('68.48');
                    else setTasaCambio('1');
                  }} 
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', outline: 'none' }}
                >
                  <option value="DOP">DOP (RD$)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label className="text-slate-500 dark:text-slate-400" style={{ display: 'block', fontSize: '9px', fontWeight: '800', marginBottom: '3px' }}>Monto</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  value={monto} 
                  onChange={e => setMonto(e.target.value)} 
                  placeholder="0.00" 
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500"
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', outline: 'none' }} 
                />
              </div>
              {moneda !== 'DOP' && (
                <div>
                  <label className="text-slate-500 dark:text-slate-400" style={{ display: 'block', fontSize: '9px', fontWeight: '800', marginBottom: '3px' }}>Tasa Cambio (RD$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={tasaCambio} 
                    onChange={e => setTasaCambio(e.target.value)} 
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', outline: 'none' }} 
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label className="text-slate-500 dark:text-slate-400" style={{ display: 'block', fontSize: '9px', fontWeight: '800', marginBottom: '3px' }}>Wallet / Cuenta</label>
                <select 
                  value={wallet} 
                  onChange={e => setWallet(e.target.value)} 
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', outline: 'none' }}
                >
                  <option value="💵 Efectivo">💵 Efectivo</option>
                  <option value="🏦 Banreservas">🏦 Banreservas</option>
                  <option value="🔵 Banco Popular">🔵 Banco Popular</option>
                  <option value="🏢 Banco BHD">🏢 Banco BHD</option>
                </select>
              </div>
              <div>
                <label className="text-slate-500 dark:text-slate-400" style={{ display: 'block', fontSize: '9px', fontWeight: '800', marginBottom: '3px' }}>Categoría</label>
                <input 
                  type="text" 
                  value={categoria} 
                  onChange={e => setCategoria(e.target.value)} 
                  placeholder="Ej. Supermercado, Sueldo..." 
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500"
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', outline: 'none' }} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label className="text-slate-500 dark:text-slate-400" style={{ display: 'block', fontSize: '9px', fontWeight: '800', marginBottom: '3px' }}>Fecha</label>
                <input 
                  type="date" 
                  required 
                  value={fecha} 
                  onChange={e => setFecha(e.target.value)} 
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', outline: 'none' }} 
                />
              </div>
              <div>
                <label className="text-slate-500 dark:text-slate-400" style={{ display: 'block', fontSize: '9px', fontWeight: '800', marginBottom: '3px' }}>Concepto</label>
                <input 
                  type="text" 
                  required 
                  value={concepto} 
                  onChange={e => setConcepto(e.target.value)} 
                  placeholder="Ej. Compra semanal..." 
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500"
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', outline: 'none' }} 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={cargando} 
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white transition-colors"
              style={{ width: '100%', padding: '11px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '6px' }}
            >
              {cargando ? 'Guardando...' : 'Guardar Transacción'}
            </button>
          </form>
        </div>

        {/* Tabla Historial */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 shadow-sm backdrop-blur-md transition-colors duration-300" style={{ borderRadius: '14px', padding: '16px' }}>
          <div className="text-emerald-600 dark:text-sky-400 border-b border-slate-200 dark:border-slate-700/80" style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', paddingBottom: '6px' }}>
            📜 Historial Presupuesto
          </div>
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700" style={{ textTransform: 'uppercase', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Fecha</th>
                  <th style={{ padding: '8px' }}>Wallet</th>
                  <th style={{ padding: '8px' }}>Tipo / Cat</th>
                  <th style={{ padding: '8px' }}>Total RD$</th>
                  <th style={{ padding: '8px' }}>Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                {transacciones.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.2)' }}>
                    <td className="text-slate-600 dark:text-slate-300" style={{ padding: '8px' }}>{row.fecha}</td>
                    <td className="text-slate-800 dark:text-slate-100" style={{ padding: '8px' }}><b>{row.wallet}</b></td>
                    <td className="text-slate-600 dark:text-slate-300" style={{ padding: '8px' }}>{row.tipo} / {row.categoria}</td>
                    <td className={row.tipo === 'Ingreso' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} style={{ padding: '8px', fontWeight: 'bold' }}>
                      RD$ {Number(row.monto_dop).toFixed(2)}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <button 
                        onClick={() => eliminarRegistro(row.id!)} 
                        className="bg-red-500 hover:bg-red-600 text-white transition-colors"
                        style={{ border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                      >
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
