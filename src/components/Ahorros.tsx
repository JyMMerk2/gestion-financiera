import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { FondoAhorro } from '../types';

interface AhorrosProps {
  familiaId: string;
  mesSeleccionado: string;
}

export const Ahorros: React.FC<AhorrosProps> = ({ familiaId, mesSeleccionado }) => {
  // Estados originales
  const [meta, setMeta] = useState('Fondo Emergencia 🚨');
  const [walletOrigen, setWalletOrigen] = useState('🏦 Banreservas');
  const [walletDestino, setWalletDestino] = useState('🔵 Banco Popular');
  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState<'Depósito' | 'Retiro'>('Depósito');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [concepto, setConcepto] = useState('');

  const [ahorrosList, setAhorrosList] = useState<FondoAhorro[]>([]);
  const [cargando, setCargando] = useState(false);

  // Estados interfaz (Modal y Modo Privacidad en true por defecto)
  const [esPrivado, setEsPrivado] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);

  const cargarAhorros = async () => {
    if (!familiaId) return;
    const { data } = await supabase
      .from('ahorros')
      .select('*')
      .eq('familia_id', familiaId)
      .order('fecha', { ascending: false });

    if (data) {
      setAhorrosList(data.filter((row: FondoAhorro) => row.fecha.startsWith(mesSeleccionado)));
    }
  };

  useEffect(() => {
    cargarAhorros();
  }, [familiaId, mesSeleccionado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto || Number(monto) <= 0) return;

    setCargando(true);
    const montoNum = Number(monto);

    try {
      await supabase.from('ahorros').insert([{
        familia_id: familiaId,
        fecha,
        meta,
        concepto,
        monto_dop: montoNum,
        monto_original: montoNum,
        moneda: 'DOP',
        tipo,
        wallet_origen: walletOrigen,
        wallet_destino: walletDestino
      }]);

      setMonto('');
      setConcepto('');
      setModalAbierto(false);
      cargarAhorros();
    } catch (err: any) {
      alert('Error al guardar ahorro: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const eliminarAhorro = async (id: string) => {
    if (!confirm('¿Deseas eliminar este registro de ahorro?')) return;
    await supabase.from('ahorros').delete().eq('id', id);
    cargarAhorros();
  };

  // Cálculos de totales
  const totalDepositos = ahorrosList
    .filter(a => a.tipo === 'Depósito')
    .reduce((acc, a) => acc + Number(a.monto_dop), 0);

  const totalRetiros = ahorrosList
    .filter(a => a.tipo === 'Retiro')
    .reduce((acc, a) => acc + Number(a.monto_dop), 0);

  const ahorroNeto = totalDepositos - totalRetiros;

  // Función para ocultar valores con animación de privacidad
  const renderValorPrivado = (valorFormateado: string, textoMascara = 'J8hd 4') => {
    return (
      <span className={`inline-block transition-all duration-300 ${esPrivado ? 'filter blur-[5px] select-none opacity-60' : 'filter blur-0 opacity-100'}`}>
        {esPrivado ? textoMascara : valorFormateado}
      </span>
    );
  };

  return (
    <div className="space-y-6">

      {/* Control de Privacidad y Botón de Acción */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm backdrop-blur-md">
        <button
          onClick={() => setEsPrivado(!esPrivado)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
        >
          {esPrivado ? '👁️ Mostrar Valores' : '🙈 Ocultar Valores (Privacidad)'}
        </button>

        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
        >
          + Registrar Nuevo Ahorro
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Total Ahorrado */}
        <div 
          onClick={() => { setTipo('Depósito'); setModalAbierto(true); }}
          className="group cursor-pointer bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all hover:border-indigo-500 dark:hover:border-indigo-500"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Ahorros / Depósitos</span>
            <span className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-bold group-hover:scale-110 transition-transform">
              🏦
            </span>
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {renderValorPrivado(`RD$ ${totalDepositos.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, 'J8hd 4')}
          </div>
        </div>

        {/* Retiros */}
        <div 
          onClick={() => { setTipo('Retiro'); setModalAbierto(true); }}
          className="group cursor-pointer bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all hover:border-amber-500 dark:hover:border-amber-500"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Retiros de Fondos</span>
            <span className="p-2 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-sm font-bold group-hover:scale-110 transition-transform">
              💸
            </span>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {renderValorPrivado(`RD$ ${totalRetiros.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, 'MfPy n')}
          </div>
        </div>

        {/* Ahorro Neto */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Total en Fondos</span>
            <span className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-bold">
              📈
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {renderValorPrivado(`RD$ ${ahorroNeto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, 't5WE X')}
          </div>
        </div>

      </div>

      {/* Historial */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm backdrop-blur-md transition-colors">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-700/80">
          <h4 className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 tracking-wider">
            📈 Historial de Ahorros ({mesSeleccionado})
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase border-b border-slate-200 dark:border-slate-700">
                <th className="p-3">Fecha</th>
                <th className="p-3">Meta / Fondo</th>
                <th className="p-3">Movimiento</th>
                <th className="p-3">Wallets (Origen ➔ Destino)</th>
                <th className="p-3">Total RD$</th>
                <th className="p-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {ahorrosList.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">{row.fecha}</td>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{row.meta}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${row.tipo === 'Depósito' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'}`}>
                      {row.tipo}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px]">
                    {row.wallet_origen} ➔ {row.wallet_destino}
                  </td>
                  <td className="p-3 font-extrabold text-indigo-600 dark:text-indigo-400">
                    {renderValorPrivado(`RD$ ${Number(row.monto_dop).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, '•• •••')}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => eliminarAhorro(row.id!)}
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg text-red-500 transition-colors cursor-pointer"
                      title="Eliminar"
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

      {/* Modal Flotante */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden transition-all duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/80">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                🏦 Registrar Fondo de Ahorro
              </h3>
              <button 
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">Fondo / Meta</label>
                  <input 
                    type="text" 
                    value={meta} 
                    onChange={e => setMeta(e.target.value)} 
                    required 
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">Movimiento</label>
                  <select 
                    value={tipo} 
                    onChange={e => setTipo(e.target.value as any)} 
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Depósito">Depósito / Ahorro (+)</option>
                    <option value="Retiro">Retiro / Uso Fondo (-)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">Wallet Origen</label>
                  <input 
                    type="text" 
                    value={walletOrigen} 
                    onChange={e => setWalletOrigen(e.target.value)} 
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">Wallet Destino</label>
                  <input 
                    type="text" 
                    value={walletDestino} 
                    onChange={e => setWalletDestino(e.target.value)} 
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">Monto (RD$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={monto} 
                    onChange={e => setMonto(e.target.value)} 
                    placeholder="0.00" 
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">Fecha</label>
                  <input 
                    type="date" 
                    required 
                    value={fecha} 
                    onChange={e => setFecha(e.target.value)} 
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">Concepto</label>
                <input 
                  type="text" 
                  value={concepto} 
                  onChange={e => setConcepto(e.target.value)} 
                  placeholder="Ej. Ahorro quincenal..." 
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>

              <button 
                type="submit" 
                disabled={cargando} 
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider transition-colors shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                {cargando ? 'Guardando...' : 'Registrar Ahorro'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
