import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { RegistroPrestamo } from '../types';

interface PrestamosProps {
  familiaId: string;
}

export const Prestamos: React.FC<PrestamosProps> = ({ familiaId }) => {
  const [entidad, setEntidad] = useState('');
  const [tipo, setTipo] = useState<'Pago Cuota' | 'Nueva Deuda'>('Pago Cuota');
  const [monto, setMonto] = useState('');
  const [wallet, setWallet] = useState('🏦 Banreservas');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [notas, setNotas] = useState('');

  const [prestamosList, setPrestamosList] = useState<RegistroPrestamo[]>([]);
  const [cargando, setCargando] = useState(false);

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

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '14px' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>
            💳 Control de Préstamos y Deudas
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#6b7280', marginBottom: '3px' }}>Institución / Prestamista</label>
              <input type="text" required value={entidad} onChange={e => setEntidad(e.target.value)} placeholder="Ej. Banco Popular, BHD, Amigo..." style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#6b7280', marginBottom: '3px' }}>Tipo Movimiento</label>
                <select value={tipo} onChange={e => setTipo(e.target.value as any)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  <option value="Pago Cuota">Pago Cuota / Abono (-)</option>
                  <option value="Nueva Deuda">Nueva Deuda / Desembolso (+)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#6b7280', marginBottom: '3px' }}>Wallet / Cuenta</label>
                <input type="text" value={wallet} onChange={e => setWallet(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb' }} />
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
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#6b7280', marginBottom: '3px' }}>Notas / Detalles</label>
              <input type="text" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Ej. Cuota #3 cancelada..." style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb' }} />
            </div>

            <button type="submit" disabled={cargando} style={{ width: '100%', background: '#f59e0b', color: '#000', padding: '11px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '6px' }}>
              {cargando ? 'Guardando...' : 'Registrar Préstamo / Pago'}
            </button>
          </form>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>
            📜 Historial de Préstamos
          </div>
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#f9fafb', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Fecha</th>
                  <th style={{ padding: '8px' }}>Institución</th>
                  <th style={{ padding: '8px' }}>Tipo</th>
                  <th style={{ padding: '8px' }}>Monto (RD$)</th>
                  <th style={{ padding: '8px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {prestamosList.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px' }}>{row.fecha}</td>
                    <td style={{ padding: '8px' }}><b>{row.entidad}</b></td>
                    <td style={{ padding: '8px' }}>{row.tipo}</td>
                    <td style={{ padding: '8px', color: '#f59e0b', fontWeight: 'bold' }}>
                      RD$ {Number(row.monto).toFixed(2)}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <button onClick={() => eliminarPrestamo(row.id!)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}>
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

export default Prestamos;
