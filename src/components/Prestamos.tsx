import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { RegistroPrestamo } from '../types';

interface PrestamosProps {
  familiaId: string;
}

export const Prestamos: React.FC<PrestamosProps> = ({ familiaId }) => {
  // Estados originales
  const [entidad, setEntidad] = useState('');
  const [tipo, setTipo] = useState<'Pago Cuota' | 'Nueva Deuda'>('Pago Cuota');
  const [monto, setMonto] = useState('');
  const [wallet, setWallet] = useState('🏦 Banreservas');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [notas, setNotas] = useState('');

  const [prestamosList, setPrestamosList] = useState<RegistroPrestamo[]>([]);
  const [cargando, setCargando] = useState(false);

  // Estados interfaz (Modal y Modo Privacidad activo por defecto)
  const [esPrivado, setEsPrivado] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);

  const cargarPrestamos = async () => {
    if (!familiaId) return;
    const { data } = await supabase
      .from('prestamos')
      .select('*')
      .eq('familia_id', familiaId)
      .order('fecha', { ascending: false });

    if (data) setPrestamosList(data);
  };

  useEffect(() => {
    cargarPrestamos();
  }, [familiaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto || Number(monto) <= 0) return;

    setCargando(true);
    try {
      await supabase.from('prestamos').insert([{
        familia_id: familiaId,
        fecha,
        entidad,
        tipo,
        monto: Number(monto),
        wallet,
        notas
      }]);

      setEntidad('');
      setMonto('');
      setNotas('');
      setModalAbierto(false);
      cargarPrestamos();
    } catch (err: any) {
      alert('Error al guardar préstamo: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const eliminarPrestamo = async (id: string) => {
    if (!confirm('¿Deseas eliminar este registro de deuda/pago?')) return;
    await supabase.from('prestamos').delete().eq('id', id);
    cargarPrestamos();
  };

  // Cálculos de totales
  const totalNuevasDeudas = prestamosList
    .filter(p => p.tipo === 'Nueva Deuda')
    .reduce((acc, p) => acc + Number(p.monto), 0);

  const totalPagosAbonos = prestamosList
    .filter(p => p.tipo === 'Pago Cuota')
    .reduce((acc, p) => acc + Number(p.monto), 0);

  const balanceDeudaPendiente = totalNuevasDeudas - totalPagosAbonos;

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
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
        >
          + Registrar Deuda / Pago
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Deuda Total / Desembolsos */}
        <div 
          onClick={() => { setTipo('Nueva Deuda'); setModalAbierto(true); }}
          className="group cursor-pointer bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all hover:border-red-500 dark:hover:border-red-500"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Nuevas Deudas / Créditos</span>
            <span className="p-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold group-hover:scale-110 transition-transform">
              💳
            </span>
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">
            {renderValorPrivado(`RD$ ${totalNuevasDeudas.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, 'J8hd 4')}
          </div>
        </div>

        {/* Abonos y Pagos */}
        <div 
          onClick={() => { setTipo('Pago Cuota'); setModalAbierto(true); }}
          className="group cursor-pointer bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all hover:border-emerald-500 dark:hover:border-emerald-500"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Pagos y Abonos Realizados</span>
            <span className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-bold group-hover:scale-110 transition-transform">
              ✅
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {renderValorPrivado(`RD$ ${totalPagosAbonos.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, 'MfPy n')}
          </div>
        </div>

        {/* Balance Pendiente */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Balance Pendiente Estimado</span>
            <span className="p-2 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-sm font-bold">
              📊
            </span>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {renderValorPrivado(`RD$ ${balanceDeudaPendiente.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, 't5WE X')}
          </div>
        </div>

      </div>

      {/* Historial */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm backdrop-blur-md transition-colors">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-700/80">
          <h4 className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 tracking-wider">
            📜 Historial de Préstamos y Pagos
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase border-b border-slate-200 dark:border-slate-700">
                <th className="p-3">Fecha</th>
                <th className="p-3">Institución / Prestamista</th>
                <th className="p-3">Tipo Movimiento</th>
                <th className="p-3">Wallet / Cuenta</th>
                <th className="p-3">Monto Total</th>
                <th className="p-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {prestamosList.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">{row.fecha}</td>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-100">
                    {row.entidad}
                    {row.notas && <p className="text-[10px] text-slate-400 font-normal">{row.notas}</p>}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${row.tipo === 'Pago Cuota' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'}`}>
                      {row.tipo}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{row.wallet}</td>
                  <td className={`p-3 font-extrabold ${row.tipo === 'Pago Cuota' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {renderValorPrivado(`RD$ ${Number(row.monto).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, '•• •••')}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => eliminarPrestamo(row.id!)}
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
                💳 Control de Préstamos y Deudas
              </h3>
              <button 
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">Institución / Prestamista</label>
                <input 
                  type="text" 
                  required 
                  value={entidad} 
                  onChange={e => setEntidad(e.target.value)} 
                  placeholder="Ej. Banco Popular, BHD, Amigo..." 
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">Tipo Movimiento</label>
                  <select 
                    value={tipo} 
                    onChange={e => setTipo(e.target.value as any)} 
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Pago Cuota">Pago Cuota / Abono (-)</option>
                    <option value="Nueva Deuda">Nueva Deuda / Desembolso (+)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">Wallet / Cuenta</label>
                  <input 
                    type="text" 
                    value={wallet} 
                    onChange={e => setWallet(e.target.value)} 
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500" 
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
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">Fecha</label>
                  <input 
                    type="date" 
                    required 
                    value={fecha} 
                    onChange={e => setFecha(e.target.value)} 
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">Notas / Detalles</label>
                <input 
                  type="text" 
                  value={notas} 
                  onChange={e => setNotas(e.target.value)} 
                  placeholder="Ej. Cuota #3 cancelada..." 
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500" 
                />
              </div>

              <button 
                type="submit" 
                disabled={cargando} 
                className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                {cargando ? 'Guardando...' : 'Registrar Préstamo / Pago'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Prestamos;
