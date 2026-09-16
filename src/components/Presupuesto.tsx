import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { TransaccionPresupuesto, TipoTransaccion } from '../types';
import { useModoOscuro } from '../hooks/useModoOscuro';
import { WalletsManager } from './WalletsManager';

interface PresupuestoProps {
  familiaId: string;
  mesSeleccionado: string;
}

interface WalletItem {
  id: string;
  nombre: string;
  moneda: string;
}

export const Presupuesto: React.FC<PresupuestoProps> = ({ familiaId, mesSeleccionado }) => {
  const { bgCard, borderCard, textPrimary, textLabel, inputStyle, textTitle, bgInput, esOscuro } = useModoOscuro();

  const [tipo, setTipo] = useState<TipoTransaccion>('Gasto');
  const [categoria, setCategoria] = useState('');
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [wallet, setWallet] = useState('💵 Efectivo');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);

  const [transacciones, setTransacciones] = useState<TransaccionPresupuesto[]>([]);
  const [walletsDinamicas, setWalletsDinamicas] = useState<WalletItem[]>([]);
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
      // Asigna por defecto la primera wallet encontrada si la actual no está en la lista
      setWallet(prev => (data.some(w => w.nombre === prev) ? prev : data[0].nombre));
    } else {
      setWalletsDinamicas([]);
    }
  };

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
    cargarWallets();
  }, [familiaId, mesSeleccionado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto || Number(monto) <= 0) return;

    setCargando(true);
    try {
      await supabase.from('presupuesto').insert([{
        familia_id: familiaId,
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '14px' }}>
      
      {/* Columna Izquierda: Formulario + Administrador de Wallets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Formulario de Registro */}
        <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, transition: 'all 0.3s' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: textTitle }}>
            ✍️ Registrar Ingreso o Gasto
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Fecha</label>
                <input type="date" required value={fecha} onChange={e => setFecha(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Concepto</label>
                <input type="text" required value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Ej. Compra semanal..." style={inputStyle} />
              </div>
            </div>

            <button type="submit" disabled={cargando} style={{ width: '100%', background: esOscuro ? '#10b981' : '#059669', color: '#fff', padding: '11px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '6px' }}>
              {cargando ? 'Guardando...' : 'Guardar Transacción'}
            </button>
          </form>
        </div>

        {/* Administrador Dinámico de Wallets y Cuentas Bancarias */}
        <WalletsManager familiaId={familiaId} onWalletCambio={cargarWallets} />

      </div>

      {/* Columna Derecha: Historial */}
      <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, transition: 'all 0.3s' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: textTitle }}>
          📜 Historial Presupuesto
        </div>
        <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
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
              {transacciones.map((row) => (
                <tr key={row.id} style={{ borderBottom: `1px solid ${borderCard}` }}>
                  <td style={{ padding: '8px', color: textLabel }}>{row.fecha}</td>
                  <td style={{ padding: '8px' }}><b>{row.wallet}</b></td>
                  <td style={{ padding: '8px' }}>{row.tipo} / {row.categoria}</td>
                  <td style={{ padding: '8px', color: row.tipo === 'Ingreso' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
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
  );
};

export default Presupuesto;
