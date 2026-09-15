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
    <div className="transition-colors duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-3.5">
        
        {/* Formulario */}
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 text-slate-800 dark:text-slate-100 shadow-sm backdrop-blur-md transition-colors">
          <div className="text-[11px] font-extrabold uppercase mb-3 border-b border-slate-200 dark:border-slate-700/80 pb-1.5 text-emerald-600 dark:text-emerald-400">
            ✍️ Registrar Ingreso o Gasto
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="block text-[9px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">Tipo</label>
                <select 
                  value={tipo} 
                  onChange={e => setTipo(e.target.value as TipoTransaccion)} 
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Ingreso">Ingreso (+)</option>
                  <option value="Gasto">Gasto (-)</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">Moneda</label>
                <select 
                  value={moneda} 
                  onChange={e => {
                    const m = e.target.value as any;
                    setMoneda(m);
                    if (m === 'USD') setTasaCambio('57.75');
                    else if (m === 'EUR') setTasaCambio('68.48');
                    else setTasaCambio('1');
                  }} 
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="DOP">DOP (RD$)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="block text-[9px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">Monto</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  value={monto} 
                  onChange={e => setMonto(e.target.value)} 
                  placeholder="0.00" 
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400 dark:placeholder-slate-500" 
                />
              </div>
              {moneda !== 'DOP' && (
                <div>
                  <label className="block text-[9px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">Tasa Cambio (RD$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={tasaCambio} 
                    onChange={e => setTasaCambio(e.target.value)} 
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="block text-[9px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">Wallet / Cuenta</label>
                <select 
                  value={wallet} 
                  onChange={e => setWallet(e.target.value)} 
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="💵 Efectivo">💵 Efectivo</option>
                  <option value="🏦 Banreservas">🏦 Banreservas</option>
                  <option value="🔵 Banco Popular">🔵 Banco Popular</option>
                  <option value="🏢 Banco BHD">🏢 Banco BHD</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">Categoría</label>
                <input 
                  type="text" 
                  value={categoria} 
                  onChange={e => setCategoria(e.target.value)} 
                  placeholder="Ej. Supermercado, Sueldo..." 
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400 dark:placeholder-slate-500" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="block text-[9px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">Fecha</label>
                <input 
                  type="date" 
                  required 
                  value={fecha} 
                  onChange={e => setFecha(e.target.value)} 
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">Concepto</label>
                <input 
                  type="text" 
                  required 
                  value={concepto} 
                  onChange={e => setConcepto(e.target.value)} 
                  placeholder="Ej. Compra semanal..." 
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400 dark:placeholder-slate-500" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={cargando} 
              className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white p-2.5 rounded-lg font-extrabold text-[11px] uppercase cursor-pointer transition-colors mt-1"
            >
              {cargando ? 'Guardando...' : 'Guardar Transacción'}
            </button>
          </form>
        </div>

        {/* Tabla Historial */}
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 text-slate-800 dark:text-slate-100 shadow-sm backdrop-blur-md transition-colors">
          <div className="text-[11px] font-extrabold uppercase mb-3 border-b border-slate-200 dark:border-slate-700/80 pb-1.5 text-emerald-600 dark:text-emerald-400">
            📜 Historial Presupuesto
          </div>
          <div className="max-h-[380px] overflow-y-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 text-left">
                  <th className="p-2">Fecha</th>
                  <th className="p-2">Wallet</th>
                  <th className="p-2">Tipo / Cat</th>
                  <th className="p-2">Total RD$</th>
                  <th className="p-2">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                {transacciones.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-2 text-slate-600 dark:text-slate-300">{row.fecha}</td>
                    <td className="p-2 font-bold text-slate-800 dark:text-slate-100">{row.wallet}</td>
                    <td className="p-2 text-slate-600 dark:text-slate-300">{row.tipo} / {row.categoria}</td>
                    <td className={`p-2 font-bold ${row.tipo === 'Ingreso' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      RD$ {Number(row.monto_dop).toFixed(2)}
                    </td>
                    <td className="p-2">
                      <button 
                        onClick={() => eliminarRegistro(row.id!)} 
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-[10px] cursor-pointer transition-colors"
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
