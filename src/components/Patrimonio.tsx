import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useModoOscuro } from '../hooks/useModoOscuro';
import { WalletsManager } from './WalletsManager';
import { Trash2, Edit2, PieChart, Landmark, X, Search } from 'lucide-react';

interface PatrimonioProps {
  familiaId: string;
}

export const Patrimonio: React.FC<PatrimonioProps> = ({ familiaId }) => {
  const { bgCard, borderCard, textPrimary, textLabel, inputStyle, textTitle, bgInput, esOscuro } = useModoOscuro();

  // Campos Formulario
  const [nombreBien, setNombreBien] = useState('');
  const [tipoBien, setTipoBien] = useState('Acciones / Inversiones');
  const [valor, setValor] = useState('');
  const [wallet, setWallet] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);

  // Estado para Edición
  const [idEditando, setIdEditando] = useState<string | null>(null);

  // Estado para Buscador Interactivo
  const [busqueda, setBusqueda] = useState('');

  const [activos, setActivos] = useState<any[]>([]);
  const [walletsDinamicas, setWalletsDinamicas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);

  const cargarWallets = async () => {
    if (!familiaId) return;
    const { data } = await supabase
      .from('wallets')
      .select('id, nombre, moneda')
      .eq('familia_id', familiaId)
      .order('created_at', { ascending: true });

    if (data && data.length > 0) {
      setWalletsDinamicas(data);
      if (!wallet) setWallet(data[0].nombre);
    } else {
      setWalletsDinamicas([]);
    }
  };

  const cargarPatrimonio = async () => {
    if (!familiaId) return;
    const { data, error } = await supabase
      .from('patrimonio')
      .select('*')
      .eq('familia_id', familiaId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar patrimonio:', error);
    } else if (data) {
      setActivos(data);
    }
  };

  useEffect(() => {
    cargarPatrimonio();
    cargarWallets();
  }, [familiaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreBien.trim() || !valor || !familiaId) {
      alert('Ingresa el nombre del bien y un valor válido.');
      return;
    }

    setCargando(true);
    try {
      const valorNum = Number(valor) || 0;
      const fechaVal = fecha || new Date().toISOString().split('T')[0];

      const payload = {
        familia_id: familiaId,
        nombre: nombreBien.trim(),
        nombre_bien: nombreBien.trim(),
        tipo_bien: tipoBien,
        valor_dop: valorNum,
        wallet: wallet || (walletsDinamicas[0]?.nombre ?? 'Efectivo'),
        fecha: fechaVal
      };

      if (idEditando) {
        const { error } = await supabase.from('patrimonio').update(payload).eq('id', idEditando);
        if (error) throw error;
        alert('¡Registro de patrimonio actualizado!');
        setIdEditando(null);
      } else {
        const { error } = await supabase.from('patrimonio').insert([payload]);
        if (error) throw error;
        alert('¡Bien/Patrimonio registrado exitosamente!');
      }

      setNombreBien('');
      setValor('');
      await cargarPatrimonio();
    } catch (err: any) {
      alert('Error de Supabase: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const iniciarEdicion = (item: any) => {
    setIdEditando(item.id);
    setNombreBien(item.nombre || item.nombre_bien || '');
    setTipoBien(item.tipo_bien || 'Acciones / Inversiones');
    setValor(String(item.valor_dop || item.valor || ''));
    setWallet(item.wallet || 'Efectivo');
    setFecha(item.fecha || item.fecha_registro || new Date().toISOString().split('T')[0]);
  };

  const cancelarEdicion = () => {
    setIdEditando(null);
    setNombreBien('');
    setValor('');
  };

  const eliminarActivo = async (id: string) => {
    if (!confirm('¿Deseas eliminar este bien del patrimonio?')) return;
    const { error } = await supabase.from('patrimonio').delete().eq('id', id);
    if (error) {
      alert('Error al eliminar: ' + error.message);
    } else {
      cargarPatrimonio();
    }
  };

  const totalPatrimonio = activos.reduce((acc, curr) => acc + Number(curr.valor_dop || curr.valor || 0), 0);

  // Cálculo por Categorías para la Gráfica
  const distribucionCategorias = activos.reduce((acc: Record<string, number>, curr) => {
    const cat = curr.tipo_bien || 'Otros Activos';
    const val = Number(curr.valor_dop || curr.valor || 0);
    acc[cat] = (acc[cat] || 0) + val;
    return acc;
  }, {});

  const coloresCategorias: Record<string, string> = {
    'Acciones / Inversiones': '#00e5ff',
    'Inmueble / Terreno': '#38bdf8',
    'Vehículo': '#ffea00',
    'Otros Activos': '#00ff41'
  };

  // Sugerencias autocompletables
  const sugerenciasBusqueda = Array.from(
    new Set([
      ...activos.map(a => a.nombre || a.nombre_bien).filter(Boolean),
      ...activos.map(a => a.tipo_bien).filter(Boolean),
      ...activos.map(a => a.wallet).filter(Boolean)
    ])
  );

  // Filtrado de la tabla según la búsqueda
  const activosFiltrados = activos.filter(row => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    const nombre = (row.nombre || row.nombre_bien || '').toLowerCase();
    const tipo = (row.tipo_bien || '').toLowerCase();
    const w = (row.wallet || '').toLowerCase();
    return nombre.includes(q) || tipo.includes(q) || w.includes(q);
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
      
      {/* Formulario + Administrador de Cuentas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ background: bgCard, border: `1px solid ${idEditando ? '#ffea00' : borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, transition: 'all 0.3s' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: idEditando ? '#ffea00' : textTitle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Landmark size={14} color={idEditando ? '#ffea00' : '#00e5ff'} /> 
              {idEditando ? '✏️ Editando Registro de Patrimonio' : '💎 Registrar Activo / Bien / Acciones'}
            </span>
            {idEditando && (
              <button onClick={cancelarEdicion} style={{ background: 'transparent', border: 'none', color: '#ff007f', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px', fontWeight: 'bold' }}>
                <X size={12} /> Cancelar
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Tipo de Activo</label>
              <select value={tipoBien} onChange={e => setTipoBien(e.target.value)} style={inputStyle}>
                <option value="Acciones / Inversiones" style={{ background: bgCard, color: textPrimary }}>📈 Acciones / Inversiones / Cooperativa</option>
                <option value="Inmueble / Terreno" style={{ background: bgCard, color: textPrimary }}>🏠 Inmueble / Terreno / Casa</option>
                <option value="Vehículo" style={{ background: bgCard, color: textPrimary }}>🚗 Vehículo</option>
                <option value="Otros Activos" style={{ background: bgCard, color: textPrimary }}>💼 Otros Activos de Valor</option>
              </select>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Nombre del Bien / Inversión</label>
              <input type="text" required value={nombreBien} onChange={e => setNombreBien(e.target.value)} placeholder="Ej. Acciones Cooperativa, Terreno..." style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Valor Estimado (RD$)</label>
                <input type="number" step="0.01" required value={valor} onChange={e => setValor(e.target.value)} placeholder="0.00" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Wallet / Entidad Institucional</label>
                <select value={wallet} onChange={e => setWallet(e.target.value)} style={inputStyle}>
                  {walletsDinamicas.length === 0 ? (
                    <option value="Efectivo" style={{ background: bgCard, color: textPrimary }}>Efectivo</option>
                  ) : (
                    walletsDinamicas.map(w => (
                      <option key={w.id} value={w.nombre} style={{ background: bgCard, color: textPrimary }}>{w.nombre} ({w.moneda})</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Fecha Registro</label>
              <input type="date" required value={fecha} onChange={e => setFecha(e.target.value)} style={inputStyle} />
            </div>

            <button type="submit" disabled={cargando} style={{ width: '100%', background: idEditando ? '#ffea00' : (esOscuro ? '#00e5ff' : '#0284c7'), color: idEditando || esOscuro ? '#0a0e14' : '#fff', padding: '11px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '6px' }}>
              {cargando ? 'Guardando...' : (idEditando ? 'Actualizar Registro' : 'Registrar Patrimonio')}
            </button>
          </form>
        </div>

        <WalletsManager familiaId={familiaId} onWalletCambio={cargarWallets} />
      </div>

      {/* Gráfica por Categoría + Historial */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Panel de Gráfica por Categoría */}
        <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: textTitle, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PieChart size={14} color="#00e5ff" /> Distribución por Categoria
          </div>

          {totalPatrimonio === 0 ? (
            <div style={{ fontSize: '10px', color: textLabel, textAlign: 'center', padding: '10px' }}>
              Sin registros para mostrar en la gráfica.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.keys(distribucionCategorias).map(cat => {
                const montoCat = distribucionCategorias[cat];
                const pct = ((montoCat / totalPatrimonio) * 100).toFixed(1);
                const colorCat = coloresCategorias[cat] || '#00e5ff';

                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold', marginBottom: '3px' }}>
                      <span>{cat} ({pct}%)</span>
                      <span style={{ color: colorCat }}>RD$ {montoCat.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ width: '100%', background: bgInput, height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, background: colorCat, height: '100%', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Historial con opción de Edición y Buscador Interactivo */}
        <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, transition: 'all 0.3s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: textTitle }}>
              🏛️ Historial de Patrimonio
            </span>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#00e5ff' }}>
              Total: RD$ {totalPatrimonio.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Buscador Interactivo con Datalist */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: bgInput, border: `1px solid ${borderCard}`, borderRadius: '8px', padding: '6px 10px', gap: '8px' }}>
              <Search size={14} color={textLabel} />
              <input
                type="text"
                list="sugerencias-patrimonio"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar bien, tipo o wallet..."
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: textPrimary,
                  fontSize: '11px',
                  outline: 'none'
                }}
              />
              {busqueda && (
                <button onClick={() => setBusqueda('')} style={{ background: 'none', border: 'none', color: textLabel, cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>
                  ✕
                </button>
              )}
            </div>

            <datalist id="sugerencias-patrimonio">
              {sugerenciasBusqueda.map((sug, i) => (
                <option key={i} value={sug} />
              ))}
            </datalist>
          </div>

          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {activosFiltrados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: textLabel, fontSize: '11px' }}>
                {busqueda ? `Sin resultados para "${busqueda}"` : 'No tienes bienes registrados en el patrimonio.'}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: bgInput, textTransform: 'uppercase', borderBottom: `1px solid ${borderCard}`, textAlign: 'left', color: textLabel }}>
                    <th style={{ padding: '8px' }}>Fecha</th>
                    <th style={{ padding: '8px' }}>Bien / Inversión</th>
                    <th style={{ padding: '8px' }}>Wallet / Entidad</th>
                    <th style={{ padding: '8px' }}>Valor RD$</th>
                    <th style={{ padding: '8px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {activosFiltrados.map((row) => (
                    <tr key={row.id} style={{ borderBottom: `1px solid ${borderCard}`, background: idEditando === row.id ? 'rgba(255, 234, 0, 0.1)' : 'transparent' }}>
                      <td style={{ padding: '8px', color: textLabel }}>{row.fecha || row.fecha_registro}</td>
                      <td style={{ padding: '8px' }}><b>{row.nombre || row.nombre_bien}</b> <br/><small style={{ color: textLabel }}>{row.tipo_bien}</small></td>
                      <td style={{ padding: '8px' }}><b>{row.wallet || 'Efectivo'}</b></td>
                      <td style={{ padding: '8px', color: '#00e5ff', fontWeight: 'bold' }}>
                        RD$ {Number(row.valor_dop || row.valor || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => iniciarEdicion(row)} title="Editar registro" style={{ background: 'transparent', border: 'none', color: '#ffea00', cursor: 'pointer' }}>
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => eliminarActivo(row.id!)} title="Eliminar registro" style={{ background: 'transparent', border: 'none', color: '#ff007f', cursor: 'pointer' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Patrimonio;
