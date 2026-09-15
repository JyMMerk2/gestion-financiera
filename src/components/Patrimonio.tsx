import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { RegistroPatrimonio } from '../types';

interface PatrimonioProps {
  familiaId: string;
}

export const Patrimonio: React.FC<PatrimonioProps> = ({ familiaId }) => {
  // Estados originales
  const [nombre, setNombre] = useState('');
  const [valor, setValor] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [fotoUrl, setFotoUrl] = useState('');

  const [patrimonioList, setPatrimonioList] = useState<RegistroPatrimonio[]>([]);
  const [cargando, setCargando] = useState(false);

  // Estados interfaz (Modal y Modo Privacidad activo por defecto)
  const [esPrivado, setEsPrivado] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);

  const cargarPatrimonio = async () => {
    if (!familiaId) return;
    const { data } = await supabase
      .from('patrimonio')
      .select('*')
      .eq('familia_id', familiaId)
      .order('fecha', { ascending: false });

    if (data) setPatrimonioList(data);
  };

  useEffect(() => {
    cargarPatrimonio();
  }, [familiaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valor || Number(valor) <= 0) return;

    setCargando(true);
    try {
      await supabase.from('patrimonio').insert([{
        familia_id: familiaId,
        fecha,
        nombre,
        valor_dop: Number(valor),
        foto_url: fotoUrl
      }]);

      setNombre('');
      setValor('');
      setFotoUrl('');
      setModalAbierto(false);
      cargarPatrimonio();
    } catch (err: any) {
      alert('Error al guardar en patrimonio: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const eliminarBien = async (id: string) => {
    if (!confirm('¿Deseas eliminar este activo del patrimonio?')) return;
    await supabase.from('patrimonio').delete().eq('id', id);
    cargarPatrimonio();
  };

  // Cálculos de totales
  const patrimonioTotal = patrimonioList.reduce((acc, p) => acc + Number(p.valor_dop), 0);
  const cantidadBienes = patrimonioList.length;

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
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
        >
          + Registrar Activo / Bien
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Valor Total del Patrimonio */}
        <div 
          onClick={() => setModalAbierto(true)}
          className="group cursor-pointer bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all hover:border-purple-500 dark:hover:border-purple-500"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Patrimonio Total Estimado</span>
            <span className="p-2 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl text-sm font-bold group-hover:scale-110 transition-transform">
              💎
            </span>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {renderValorPrivado(`RD$ ${patrimonioTotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, 'J8hd 4')}
          </div>
        </div>

        {/* Total de Activos Registrados */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Bienes / Activos Registrados</span>
            <span className="p-2 bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-xl text-sm font-bold">
              🏛️
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {cantidadBienes} {cantidadBienes === 1 ? 'Activo' : 'Activos'}
          </div>
        </div>

      </div>

      {/* Historial */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm backdrop-blur-md transition-colors">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-700/80">
          <h4 className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 tracking-wider">
            🏛️ Historial de Patrimonio
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase border-b border-slate-200 dark:border-slate-700">
                <th className="p-3">Fecha</th>
                <th className="p-3">Bien / Activo</th>
                <th className="p-3">Valor Estimado (RD$)</th>
                <th className="p-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {patrimonioList.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">{row.fecha}</td>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-100">
                    {row.nombre}
                    {row.foto_url && (
                      <a href={row.foto_url} target="_blank" rel="noreferrer" className="ml-2 text-[10px] text-purple-500 underline">
                        [Ver referencia]
                      </a>
                    )}
                  </td>
                  <td className="p-3 font-extrabold text-purple-600 dark:text-purple-400">
                    {renderValorPrivado(`RD$ ${Number(row.valor_dop).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, '•• •••')}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => eliminarBien(row.id!)}
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
                💎 Registrar Activo / Bien
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
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">Nombre del Bien</label>
                <input 
                  type="text" 
                  required 
                  value={nombre} 
                  onChange={e => setNombre(e.target.value)} 
                  placeholder="Ej. Terreno, Vehículo, Joyas..." 
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">Valor Estimado (RD$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={valor} 
                    onChange={e => setValor(e.target.value)} 
                    placeholder="0.00" 
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">Fecha Registro</label>
                  <input 
                    type="date" 
                    required 
                    value={fecha} 
                    onChange={e => setFecha(e.target.value)} 
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">Foto / Referencia (Opcional)</label>
                <input 
                  type="text" 
                  value={fotoUrl} 
                  onChange={e => setFotoUrl(e.target.value)} 
                  placeholder="Ej. URL de la foto..." 
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500" 
                />
              </div>

              <button 
                type="submit" 
                disabled={cargando} 
                className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider transition-colors shadow-lg shadow-purple-600/20 cursor-pointer"
              >
                {cargando ? 'Guardando...' : 'Registrar Patrimonio'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
