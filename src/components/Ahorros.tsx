import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { FondoAhorro } from '../types';

interface AhorrosProps {
  familiaId: string;
  mesSeleccionado: string;
}

export const Ahorros: React.FC<AhorrosProps> = ({ familiaId, mesSeleccionado }) => {
  const [meta, setMeta] = useState('Fondo Emergencia 🚨');
  const [walletOrigen, setWalletOrigen] = useState('🏦 Banreservas');
  const [walletDestino, setWalletDestino] = useState('🔵 Banco Popular');
  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState<'Depósito' | 'Retiro'>('Depósito');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [concepto, setConcepto] = useState('');

  const [ahorrosList, setAhorrosList] = useState<FondoAhorro[]>([]);
  const [cargando, setCargando] = useState(false);

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

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '14px' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>
            🏦 Registrar Fondo de Ahorro
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#6b7280', marginBottom: '3px' }}>Fondo / Meta</label>
                <input type="text" value={meta} onChange={e => setMeta(e.target.value)} required style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#6b7280', marginBottom: '3px' }}>Movimiento</label>
                <select value={tipo} onChange={e => setTipo(e.target.value as any)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  <option value="Depósito">Depósito / Ahorro (+)</option>
                  <option value="Retiro">Retiro / Uso Fondo (-)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#6b7280', marginBottom: '3px' }}>Wallet Origen</label>
                <input type="text" value={walletOrigen} onChange={e => setWalletOrigen(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#6b7280', marginBottom: '3px' }}>Wallet Destino</label>
                <input type="text" value={walletDestino} onChange={e => setWalletDestino(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#6b7280', marginBottom: '3px' }}>Monto (RD$)</label>
                <input type="number" step="0.01" required value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#6b7280', marginBottom: '3px' }}>Fecha</label>
                <input type="date" required value={fecha} onChange={e => setFecha(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb' }} />
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#6b7280', marginBottom: '3px' }}>Concepto</label>
              <input type="text" value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Ej. Ahorro quincenal..." style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb' }} />
            </div>

            <button type="submit" disabled={cargando} style={{ width: '100%', background: '#4f46e5', color: '#fff', padding: '11px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '6px' }}>
              {cargando ? 'Guardando...' : 'Registrar Ahorro'}
            </button>
          </form>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>
            📈 Historial de Ahorros
          </div>
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#f9fafb', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Fecha</th>
                  <th style={{ padding: '8px' }}>Meta / Fondo</th>
                  <th style={{ padding: '8px' }}>Tipo</th>
                  <th style={{ padding: '8px' }}>Total RD$</th>
                  <th style={{ padding: '8px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {ahorrosList.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px' }}>{row.fecha}</td>
                    <td style={{ padding: '8px' }}><b>{row.meta}</b></td>
                    <td style={{ padding: '8px' }}>{row.tipo}</td>
                    <td style={{ padding: '8px', color: '#4f46e5', fontWeight: 'bold' }}>
                      RD$ {Number(row.monto_dop).toFixed(2)}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <button onClick={() => eliminarAhorro(row.id!)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}>
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
