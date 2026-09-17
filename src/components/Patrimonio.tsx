import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useModoOscuro } from '../hooks/useModoOscuro';
import { WalletsManager } from './WalletsManager';
import { Trash2, PieChart, Landmark } from 'lucide-react';

interface PatrimonioProps {
  familiaId: string;
}

export const Patrimonio: React.FC<PatrimonioProps> = ({ familiaId }) => {
  const { bgCard, borderCard, textPrimary, textLabel, inputStyle, textTitle, bgInput } = useModoOscuro();

  const [nombreBien, setNombreBien] = useState('');
  const [tipoBien, setTipoBien] = useState('Acciones / Inversiones');
  const [valor, setValor] = useState('');
  const [wallet, setWallet] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);

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

      const { error } = await supabase.from('patrimonio').insert([payload]);

      if (error) {
        alert('Error de Supabase al guardar patrimonio: ' + error.message);
      } else {
        alert('¡Bien/Patrimonio registrado exitosamente!');
        setNombreBien('');
        setValor('');
        await cargarPatrimonio();
      }
    } catch (err: any) {
      alert('Error inesperado: ' + err.message);
    } finally {
      setCargando(false);
    }
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

  // Agrupar los activos por categoría/tipo para generar la gráfica
  const distribucionCategorias = activos.reduce((acc: Record<string, number>, curr) => {
    const cat = curr.tipo_bien || curr.tipo || 'Otros Activos';
    const val = Number(curr.valor_dop || curr.valor || 0);
    acc[cat] = (acc[cat] || 0) + val;
    return acc;
  }, {});

  const coloresCategorias: Record<string, string> = {
    'Acciones / Inversiones': '#8b5cf6',
    'Inmueble / Terreno': '#38bdf8',
    'Vehículo': '#f59e0b',
    'Otros Activos': '#10b981'
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
      
      {/* Formulario + Cuentas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: textTitle, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Landmark size={14} color="#8b5cf6" /> Registrar Activo / Bien / Acciones
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Tipo de Activo</label>
              <select value={tipoBien} onChange={e => setTipoBien(e.target.value)} style={inputStyle}>
                <option value="Acciones / Inversiones">📈 Acciones / Inversiones / Cooperativa</option>
                <option value="Inmueble / Terreno">🏠 Inmueble / Terreno / Casa</option>
                <option value="Vehículo">🚗 Vehículo</option>
                <option value="Otros Activos">💼 Otros Activos de Valor</option>
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
                    <option value="Efectivo">Efectivo</option>
                  ) : (
                    walletsDinamicas.map(w => (
                      <option key={w.id} value={w.nombre}>{w.nombre} ({w.moneda})</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Fecha Registro</label>
              <input type="date" required value={fecha} onChange={e => setFecha(e.target.value)} style={inputStyle} />
            </div>

            <button type="submit" disabled={cargando} style={{ width: '100%', background: '#8b5cf6', color: '#fff', padding: '11px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '6px' }}>
              {cargando ? 'Guardando...' : 'Registrar Patrimonio'}
            </button>
          </form>
        </div>

        <WalletsManager familiaId={familiaId} onWalletCambio={cargarWallets} />
      </div>

      {/* Gráfica de Distribución + Historial */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Gráfica de Patrimonio por Categoría */}
        <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: textTitle, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PieChart size={14} color="#38bdf8" /> Distribución del Patrimonio por Categoria
          </div>

          {totalPatrimonio === 0 ? (
            <div style={{ fontSize: '10px', color: textLabel, textAlign: 'center', padding: '10px' }}>
              Sin datos para generar la gráfica.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.keys(distribucionCategorias).map(cat => {
                const montoCat = distribucionCategorias[cat];
                const pct = ((montoCat / totalPatrimonio) * 100).toFixed(1);
                const colorCat = coloresCategorias[cat] || '#8b5cf6';

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

        {/* Historial */}
        <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: textTitle }}>
              🏛️ Historial de Patrimonio
            </span>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#8b5cf6' }}>
              Total: RD$ {totalPatrimonio.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {activos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: textLabel, fontSize: '11px' }}>
                No tienes bienes registrados en el patrimonio.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: bgInput, textTransform: 'uppercase', borderBottom: `1px solid ${borderCard}`, textAlign: 'left', color: textLabel }}>
                    <th style={{ padding: '8px' }}>Fecha</th>
                    <th style={{ padding: '8px' }}>Bien / Inversión</th>
                    <th style={{ padding: '8px' }}>Wallet / Entidad</th>
                    <th style={{ padding: '8px' }}>Valor RD$</th>
                    <th style={{ padding: '8px' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {activos.map((row) => (
                    <tr key={row.id} style={{ borderBottom: `1px solid ${borderCard}` }}>
                      <td style={{ padding: '8px', color: textLabel }}>{row.fecha || row.fecha_registro}</td>
                      <td style={{ padding: '8px' }}><b>{row.nombre || row.nombre_bien}</b> <br/><small style={{ color: textLabel }}>{row.tipo_bien}</small></td>
                      <td style={{ padding: '8px' }}><b>{row.wallet || 'Efectivo'}</b></td>
                      <td style={{ padding: '8px', color: '#8b5cf6', fontWeight: 'bold' }}>
                        RD$ {Number(row.valor_dop || row.valor || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <button onClick={() => eliminarActivo(row.id!)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                          <Trash2 size={13} />
                        </button>
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
