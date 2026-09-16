import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useModoOscuro } from '../hooks/useModoOscuro';
import { WalletsManager } from './WalletsManager';
import { AlertCircle, Trash2, Plus } from 'lucide-react';

interface PrestamosProps {
  familiaId: string;
}

interface ItemPrestamo {
  id?: string;
  familia_id: string;
  acreedor: string;
  tipo: 'Por Pagar' | 'Por Cobrar';
  monto_original: number;
  balance_pendiente: number;
  cuotas_totales: number;
  cuotas_pagadas: number;
  monto_atraso: number;
  wallet: string;
  estado: string;
}

export const Prestamos: React.FC<PrestamosProps> = ({ familiaId }) => {
  const { bgCard, borderCard, textPrimary, textLabel, inputStyle, textTitle, bgInput } = useModoOscuro();

  const [acreedor, setAcreedor] = useState('');
  const [tipo, setTipo] = useState<'Por Pagar' | 'Por Cobrar'>('Por Pagar');
  const [montoOriginal, setMontoOriginal] = useState('');
  const [balancePendiente, setBalancePendiente] = useState('');
  const [cuotasTotales, setCuotasTotales] = useState('12');
  const [cuotasPagadas, setCuotasPagadas] = useState('0');
  const [montoAtraso, setMontoAtraso] = useState('0');
  const [wallet, setWallet] = useState('Efectivo');

  const [prestamos, setPrestamos] = useState<ItemPrestamo[]>([]);
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

  const cargarPrestamos = async () => {
    if (!familiaId) return;
    const { data } = await supabase
      .from('prestamos')
      .select('*')
      .eq('familia_id', familiaId)
      .order('created_at', { ascending: false });

    if (data) setPrestamos(data);
  };

  useEffect(() => {
    cargarPrestamos();
    cargarWallets();
  }, [familiaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acreedor.trim() || !familiaId) return;

    setCargando(true);
    try {
      const orig = Number(montoOriginal) || 0;
      const pend = balancePendiente ? Number(balancePendiente) : orig;

      await supabase.from('prestamos').insert([{
        familia_id: familiaId,
        acreedor: acreedor.trim(),
        tipo,
        monto_original: orig,
        balance_pendiente: pend,
        cuotas_totales: Number(cuotasTotales) || 1,
        cuotas_pagadas: Number(cuotasPagadas) || 0,
        monto_atraso: Number(montoAtraso) || 0,
        wallet: wallet || 'Efectivo',
        estado: 'Activo'
      }]);

      setAcreedor('');
      setMontoOriginal('');
      setBalancePendiente('');
      setMontoAtraso('0');
      await cargarPrestamos();
    } catch (err: any) {
      alert('Error al guardar préstamo: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const abonarCuota = async (item: ItemPrestamo) => {
    const valorCuotaStr = prompt(`Ingresa el monto a abonar/pagar a ${item.acreedor}:`);
    if (!valorCuotaStr || isNaN(Number(valorCuotaStr))) return;

    const valorAbono = Number(valorCuotaStr);
    const nuevoBalance = Math.max(0, item.balance_pendiente - valorAbono);
    const nuevasCuotas = item.cuotas_pagadas + 1;
    const nuevoAtraso = Math.max(0, item.monto_atraso - valorAbono);

    await supabase.from('prestamos').update({
      balance_pendiente: nuevoBalance,
      cuotas_pagadas: nuevasCuotas,
      monto_atraso: nuevoAtraso,
      estado: nuevoBalance === 0 ? 'Liquidado' : 'Activo'
    }).eq('id', item.id);

    cargarPrestamos();
  };

  const eliminarPrestamo = async (id: string) => {
    if (!confirm('¿Deseas eliminar este préstamo?')) return;
    await supabase.from('prestamos').delete().eq('id', id);
    cargarPrestamos();
  };

  const totalAtrasos = prestamos
    .filter(p => p.tipo === 'Por Pagar')
    .reduce((acc, curr) => acc + Number(curr.monto_atraso), 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '14px' }}>
      
      {/* Formulario e Integración con Wallets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: textTitle }}>
            💳 Registrar Préstamo / Deuda
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Tipo de Registro</label>
                <select value={tipo} onChange={e => setTipo(e.target.value as any)} style={inputStyle}>
                  <option value="Por Pagar">Deuda mía (Por Pagar)</option>
                  <option value="Por Cobrar">Le presté a alguien (Por Cobrar)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Banco / Entidad / Persona</label>
                <input type="text" required value={acreedor} onChange={e => setAcreedor(e.target.value)} placeholder="Ej. Banco BHD, Juan Pérez..." style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Monto Inicial (RD$)</label>
                <input type="number" step="0.01" required value={montoOriginal} onChange={e => setMontoOriginal(e.target.value)} placeholder="0.00" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Balance Pendiente (RD$)</label>
                <input type="number" step="0.01" value={balancePendiente} onChange={e => setBalancePendiente(e.target.value)} placeholder="Monto restante" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Wallet / Cuenta</label>
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
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Cuotas Totales</label>
                <input type="number" value={cuotasTotales} onChange={e => setCuotasTotales(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Cuotas Pagadas</label>
                <input type="number" value={cuotasPagadas} onChange={e => setCuotasPagadas(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Monto en Atraso (RD$)</label>
              <input type="number" step="0.01" value={montoAtraso} onChange={e => setMontoAtraso(e.target.value)} style={{ ...inputStyle, color: Number(montoAtraso) > 0 ? '#ef4444' : textPrimary, fontWeight: 'bold' }} />
            </div>

            <button type="submit" disabled={cargando} style={{ width: '100%', background: '#0284c7', color: '#fff', padding: '11px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '6px' }}>
              {cargando ? 'Guardando...' : 'Registrar Préstamo'}
            </button>
          </form>
        </div>

        {/* Creador/Administrador de Wallets */}
        <WalletsManager familiaId={familiaId} onWalletCambio={cargarWallets} />
      </div>

      {/* Lista de Préstamos */}
      <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: textTitle }}>
            📊 Mis Préstamos y Compromisos
          </span>
          {totalAtrasos > 0 && (
            <span style={{ fontSize: '10px', background: '#ef444422', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={12} /> Atrasos: RD$ {totalAtrasos.toLocaleString()}
            </span>
          )}
        </div>

        <div style={{ maxHeight: '480px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {prestamos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: textLabel, fontSize: '11px' }}>
              No tienes préstamos ni deudas registradas.
            </div>
          ) : (
            prestamos.map(p => (
              <div key={p.id} style={{ background: bgInput, border: `1px solid ${p.monto_atraso > 0 ? '#ef444488' : borderCard}`, borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800' }}>
                    {p.tipo === 'Por Pagar' ? '🔴' : '🟢'} {p.acreedor} <small style={{ fontWeight: 'normal', color: textLabel }}>({p.wallet})</small>
                  </span>
                  <span style={{ fontSize: '10px', background: p.estado === 'Liquidado' ? '#10b98122' : borderCard, color: p.estado === 'Liquidado' ? '#10b981' : textLabel, padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                    {p.estado}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '10px', color: textLabel, marginBottom: '8px' }}>
                  <div>Original: <b style={{ color: textPrimary }}>RD$ {Number(p.monto_original).toLocaleString()}</b></div>
                  <div>Pendiente: <b style={{ color: p.tipo === 'Por Pagar' ? '#ef4444' : '#10b981' }}>RD$ {Number(p.balance_pendiente).toLocaleString()}</b></div>
                  <div>Cuotas: <b>{p.cuotas_pagadas} / {p.cuotas_totales}</b></div>
                </div>

                {p.monto_atraso > 0 && (
                  <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold', marginBottom: '8px' }}>
                    ⚠️ En Atraso: RD$ {Number(p.monto_atraso).toLocaleString()}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  {p.balance_pendiente > 0 && (
                    <button onClick={() => abonarCuota(p)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Plus size={12} /> Registrar Pago
                    </button>
                  )}
                  <button onClick={() => eliminarPrestamo(p.id!)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default Prestamos;
