import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { TransaccionPresupuesto, TipoTransaccion } from '../types';
import { useModoOscuro } from '../hooks/useModoOscuro';
import { WalletsManager } from './WalletsManager';
import { ChevronLeft, ChevronRight, Calendar, Trash2, Search } from 'lucide-react';

interface PresupuestoProps {
  familiaId?: string;
  mesSeleccionado: string;
  perfil?: any;
}

interface WalletItem {
  id: string;
  nombre: string;
  moneda: string;
}

export const Presupuesto: React.FC<PresupuestoProps> = ({ mesSeleccionado: mesProp, perfil }) => {
  const { bgCard, borderCard, textPrimary, textLabel, inputStyle, textTitle, bgInput, esOscuro } = useModoOscuro();

  // Estado local para permitir la navegación dinámica entre meses
  const [mesActual, setMesActual] = useState(mesProp);

  useEffect(() => {
    if (mesProp) setMesActual(mesProp);
  }, [mesProp]);

  const [tipo, setTipo] = useState<TipoTransaccion>('Gasto');
  const [categoria, setCategoria] = useState('');
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [wallet, setWallet] = useState('💵 Efectivo');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);

  const [transacciones, setTransacciones] = useState<TransaccionPresupuesto[]>([]);
  const [walletsDinamicas, setWalletsDinamicas] = useState<WalletItem[]>([]);
  const [cargando, setCargando] = useState(false);

  // Estado para la búsqueda en el historial
  const [busqueda, setBusqueda] = useState('');

  const cambiarMes = (delta: number) => {
    const [year, month] = mesActual.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    setMesActual(`${newYear}-${newMonth}`);
  };

  const obtenerNombreMes = (mesStr: string) => {
    if (!mesStr) return '';
    const [year, month] = mesStr.split('-');
    const nombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${nombres[parseInt(month, 10) - 1]} ${year}`;
  };

  // Carga de Wallets Privadas del Usuario
  const cargarWallets = useCallback(async () => {
    const userId = perfil?.id || (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    const { data } = await supabase
      .from('wallets')
      .select('id, nombre, moneda')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (data && data.length > 0) {
      setWalletsDinamicas(data);
      setWallet(prev => (data.some(w => w.nombre === prev) ? prev : data[0].nombre));
    } else {
      setWalletsDinamicas([]);
    }
  }, [perfil]);

  // Carga de Transacciones Privadas por usuario (user_id)
  const cargarTransacciones = useCallback(async () => {
    const userId = perfil?.id || (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    const { data } = await supabase
      .from('presupuesto')
      .select('*')
      .eq('user_id', userId)
      .order('fecha', { ascending: false });

    if (data) {
      setTransacciones(data.filter((row: TransaccionPresupuesto) => row.fecha.startsWith(mesActual)));
    }
  }, [mesActual, perfil]);

  useEffect(() => {
    cargarTransacciones();
    cargarWallets();
  }, [cargarTransacciones, cargarWallets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto || Number(monto) <= 0) return;

    setCargando(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Usuario no autenticado.');

      await supabase.from('presupuesto').insert([{
        user_id: user.id,
        fecha,
        tipo,
        categoria: categoria || 'General',
        concepto: concepto.trim(),
        monto_dop: Number(monto),
        monto_original: Number(monto),
        moneda: 'DOP',
        tasa_cambio: 1,
        wallet
      }]);

      setMonto('');
      setConcepto('');
      setCategoria('');
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

  // Sugerencias para el buscador
  const sugerenciasBusqueda = Array.from(
    new Set([
      ...transacciones.map(t => t.categoria).filter(Boolean),
      ...transacciones.map(t => t.concepto).filter(Boolean),
      ...transacciones.map(t => t.wallet).filter(Boolean)
    ])
  );

  // Filtrado dinámico
  const transaccionesFiltradas = transacciones.filter(t => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      (t.concepto && t.concepto.toLowerCase().includes(q)) ||
      (t.categoria && t.categoria.toLowerCase().includes(q)) ||
      (t.wallet && t.wallet.toLowerCase().includes(q)) ||
      (t.tipo && t.tipo.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
      
      {/* Columna Izquierda: Formulario + Wallets Privadas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Formulario de Registro */}
        <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, transition: 'all 0.3s' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: textTitle }}>
            ✍️ Registrar Ingreso o Gasto (Privado)
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Tipo</label>
                <select value={tipo} onChange={e => setTipo(e.target.value as TipoTransaccion)} style={inputStyle}>
                  <option value="Ingreso" style={{ background: bgCard, color: textPrimary }}>Ingreso (+)</option>
                  <option value="Gasto" style={{ background: bgCard, color: textPrimary }}>Gasto (-)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Categoría</label>
                <input type="text" value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Ej. Supermercado..." style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Monto (RD$)</label>
                <input type="number" step="0.01" required value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Wallet / Cuenta</label>
                <select value={wallet} onChange={e => setWallet(e.target.value)} style={inputStyle}>
                  {walletsDinamicas.length === 0 ? (
                    <>
                      <option value="💵 Efectivo" style={{ background: bgCard, color: textPrimary }}>💵 Efectivo</option>
                      <option value="🏦 Banreservas" style={{ background: bgCard, color: textPrimary }}>🏦 Banreservas</option>
                      <option value="🔵 Banco Popular" style={{ background: bgCard, color: textPrimary }}>🔵 Banco Popular</option>
                    </>
                  ) : (
                    walletsDinamicas.map(w => (
                      <option key={w.id} value={w.nombre} style={{ background: bgCard, color: textPrimary }}>
                        {w.nombre} ({w.moneda})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Fecha</label>
                <input type="date" required value={fecha} onChange={e => setFecha(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Concepto</label>
                <input type="text" required value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Ej. Compra semanal..." style={inputStyle} />
              </div>
            </div>

            <button type="submit" disabled={cargando} style={{ width: '100%', background: esOscuro ? '#00e5ff' : '#059669', color: esOscuro ? '#0a0e14' : '#fff', padding: '11px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '6px' }}>
              {cargando ? 'Guardando...' : 'Guardar Transacción'}
            </button>
          </form>
        </div>

        {/* Wallets Privadas */}
        <WalletsManager familiaId={perfil?.id} onWalletCambio={cargarWallets} />

      </div>

      {/* Columna Derecha: Historial con Buscador */}
      <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, transition: 'all 0.3s' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: textTitle }}>
            📜 Historial Personal
          </span>

          <div style={{ display: 'flex', alignItems: 'center', background: bgInput, border: `1px solid ${borderCard}`, borderRadius: '20px', padding: '3px 10px', gap: '8px' }}>
            <button onClick={() => cambiarMes(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textPrimary, display: 'flex', alignItems: 'center' }}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={12} color="#00e5ff" /> {obtenerNombreMes(mesActual)}
            </span>
            <button onClick={() => cambiarMes(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textPrimary, display: 'flex', alignItems: 'center' }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: bgInput, border: `1px solid ${borderCard}`, borderRadius: '8px', padding: '6px 10px', gap: '8px' }}>
            <Search size={14} color={textLabel} />
            <input
              type="text"
              list="sugerencias-presupuesto"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por concepto, categoría o wallet..."
              style={{ width: '100%', background: 'transparent', border: 'none', color: textPrimary, fontSize: '11px', outline: 'none' }}
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} style={{ background: 'none', border: 'none', color: textLabel, cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>✕</button>
            )}
          </div>
          <datalist id="sugerencias-presupuesto">
            {sugerenciasBusqueda.map((sug, i) => <option key={i} value={sug} />)}
          </datalist>
        </div>

        <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
          {transaccionesFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: textLabel, fontSize: '11px' }}>
              {busqueda ? `Sin resultados para "${busqueda}"` : `Sin transacciones en ${obtenerNombreMes(mesActual)}.`}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: bgInput, textTransform: 'uppercase', borderBottom: `1px solid ${borderCard}`, textAlign: 'left', color: textLabel }}>
                  <th style={{ padding: '8px' }}>Fecha</th>
                  <th style={{ padding: '8px' }}>Wallet</th>
                  <th style={{ padding: '8px' }}>Tipo / Cat</th>
                  <th style={{ padding: '8px' }}>Total RD$</th>
                  <th style={{ padding: '8px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {transaccionesFiltradas.map((row) => (
                  <tr key={row.id} style={{ borderBottom: `1px solid ${borderCard}` }}>
                    <td style={{ padding: '8px', color: textLabel }}>{row.fecha}</td>
                    <td style={{ padding: '8px' }}><b>{row.wallet}</b></td>
                    <td style={{ padding: '8px' }}>
                      <b>{row.tipo}</b> <br />
                      <small style={{ color: textLabel }}>{row.concepto || row.categoria}</small>
                    </td>
                    <td style={{ padding: '8px', color: row.tipo === 'Ingreso' ? '#00ff41' : '#ff007f', fontWeight: 'bold' }}>
                      {row.tipo === 'Ingreso' ? '+' : '-'} RD$ {Number(row.monto_dop).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <button onClick={() => eliminarRegistro(row.id!)} style={{ background: '#ff007f', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}>
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
  );
};

export default Presupuesto;
