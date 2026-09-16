import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useModoOscuro } from '../hooks/useModoOscuro';
import { WalletsManager } from './WalletsManager';

interface AhorrosProps {
  familiaId: string;
  mesSeleccionado: string;
}

interface WalletItem {
  id: string;
  nombre: string;
  moneda: string;
}

export const Ahorros: React.FC<AhorrosProps> = ({ familiaId, mesSeleccionado }) => {
  const { bgCard, borderCard, textPrimary, textLabel, inputStyle, textTitle, bgInput, esOscuro } = useModoOscuro();

  const [fondo, setFondo] = useState('Fondo Emergencia 🚨');
  const [movimiento, setMovimiento] = useState('Depósito / Ahorro (+)');
  const [walletOrigen, setWalletOrigen] = useState('');
  const [walletDestino, setWalletDestino] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [concepto, setConcepto] = useState('');

  const [ahorros, setAhorros] = useState<any[]>([]);
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
      if (!walletOrigen) setWalletOrigen(data[0].nombre);
      if (!walletDestino) setWalletDestino(data[1]?.nombre || data[0].nombre);
    } else {
      setWalletsDinamicas([]);
    }
  };

  const cargarAhorros = async () => {
    if (!familiaId) return;
    const { data } = await supabase
      .from('ahorros')
      .select('*')
      .eq('familia_id', familiaId)
      .order('fecha', { ascending: false });

    if (data) {
      setAhorros(data.filter((row: any) => row.fecha.startsWith(mesSeleccionado)));
    }
  };

  useEffect(() => {
    cargarAhorros();
    cargarWallets();
  }, [familiaId, mesSeleccionado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto || Number(monto) <= 0) return;

    setCargando(true);
    try {
      await supabase.from('ahorros').insert([{
        familia_id: familiaId,
        fecha,
        fondo,
        movimiento,
        wallet_origen: walletOrigen,
        wallet_destino: walletDestino,
        monto_dop: Number(monto),
        concepto: concepto.trim()
      }]);

      setMonto('');
      setConcepto('');
      cargarAhorros();
    } catch (err: any) {
      alert('Error al guardar ahorro: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const eliminarRegistro = async (id: string) => {
    if (!confirm('¿Deseas eliminar este registro de ahorro?')) return;
    await supabase.from('ahorros').delete().eq('id', id);
    cargarAhorros();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '14px' }}>
      
      {/* Columna Izquierda: Formulario + Administrador de Wallets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, transition: 'all 0.3s' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: textTitle }}>
            🏦 Registrar Fondo de Ahorro
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Fondo / Meta</label>
                <input type="text" value={fondo} onChange={e => setFondo(e.target.value)} placeholder="Ej. Emergencia, Retiro..." style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Movimiento</label>
                <select value={movimiento} onChange={e => setMovimiento(e.target.value)} style={inputStyle}>
                  <option value="Depósito / Ahorro (+)" style={{ background: bgCard, color: textPrimary }}>Depósito / Ahorro (+)</option>
                  <option value="Retiro / Uso (-)" style={{ background: bgCard, color: textPrimary }}>Retiro / Uso (-)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Wallet Origen</label>
                <select value={walletOrigen} onChange={e => setWalletOrigen(e.target.value)} style={inputStyle}>
                  {walletsDinamicas.length === 0 ? (
                    <option value="Efectivo" style={{ background: bgCard, color: textPrimary }}>Efectivo</option>
                  ) : (
                    walletsDinamicas.map(w => (
                      <option key={w.id} value={w.nombre} style={{ background: bgCard, color: textPrimary }}>
                        {w.nombre} ({w.moneda})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Wallet Destino</label>
                <select value={walletDestino} onChange={e => setWalletDestino(e.target.value)} style={inputStyle}>
                  {walletsDinamicas.length === 0 ? (
                    <option value="Cuenta Ahorros" style={{ background: bgCard, color: textPrimary }}>Cuenta Ahorros</option>
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
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Monto (RD$)</label>
                <input type="number" step="0.01" required value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Fecha</label>
                <input type="date" required value={fecha} onChange={e => setFecha(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Concepto</label>
              <input type="text" value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Ej. Ahorro quincenal..." style={inputStyle} />
            </div>

            <button type="submit" disabled={cargando} style={{ width: '100%', background: esOscuro ? '#6366f1' : '#4f46e5', color: '#fff', padding: '11px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '6px' }}>
              {cargando ? 'Guardando...' : 'Registrar Ahorro'}
            </button>
          </form>
        </div>

        {/* Administrador Dinámico de Wallets */}
        <WalletsManager familiaId={familiaId} onWalletCambio={cargarWallets} />

      </div>

      {/* Columna Derecha: Historial */}
      <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, transition: 'all 0.3s' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: textTitle }}>
          📈 Historial de Ahorros
        </div>
        <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: bgInput, textTransform: 'uppercase', borderBottom: `1px solid ${borderCard}`, textAlign: 'left', color: textLabel }}>
                <th style={{ padding: '8px' }}>Fecha</th>
                <th style={{ padding: '8px' }}>Meta / Fondo</th>
                <th style={{ padding: '8px' }}>Tipo</th>
                <th style={{ padding: '8px' }}>Total RD$</th>
                <th style={{ padding: '8px' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {ahorros.map((row) => (
                <tr key={row.id} style={{ borderBottom: `1px solid ${borderCard}` }}>
                  <td style={{ padding: '8px', color: textLabel }}>{row.fecha}</td>
                  <td style={{ padding: '8px' }}><b>{row.fondo}</b></td>
                  <td style={{ padding: '8px' }}>{row.movimiento}</td>
                  <td style={{ padding: '8px', color: row.movimiento.includes('Depósito') ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
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

export default Ahorros;
