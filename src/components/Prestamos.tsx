import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useModoOscuro } from '../hooks/useModoOscuro';
import { WalletsManager } from './WalletsManager';
import { AlertCircle, Trash2, Plus } from 'lucide-react';

interface PrestamosProps {
  familiaId: string;
}

export const Prestamos: React.FC<PrestamosProps> = ({ familiaId }) => {
  const { bgCard, borderCard, textPrimary, textLabel, inputStyle, textTitle, bgInput } = useModoOscuro();

  const [modoFormulario, setModoFormulario] = useState<'registrar' | 'pagar'>('registrar');

  // Campos Registro
  const [acreedor, setAcreedor] = useState('');
  const [tipo, setTipo] = useState<'Por Pagar' | 'Por Cobrar'>('Por Pagar');
  const [montoOriginal, setMontoOriginal] = useState('');
  const [balancePendiente, setBalancePendiente] = useState('');
  const [cuotasTotales, setCuotasTotales] = useState('12');
  const [cuotasPagadas, setCuotasPagadas] = useState('0');
  const [montoAtraso, setMontoAtraso] = useState('0');
  const [wallet, setWallet] = useState('');

  // Campos Pago
  const [prestamoSeleccionadoId, setPrestamoSeleccionadoId] = useState('');
  const [montoPago, setMontoPago] = useState('');
  const [walletPago, setWalletPago] = useState('');

  const [prestamos, setPrestamos] = useState<any[]>([]);
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
      if (!walletPago) setWalletPago(data[0].nombre);
    } else {
      setWalletsDinamicas([]);
    }
  };

  const cargarPrestamos = async () => {
    if (!familiaId) return;
    const { data, error } = await supabase
      .from('prestamos')
      .select('*')
      .eq('familia_id', familiaId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar préstamos:', error);
    } else if (data) {
      setPrestamos(data);
      if (data.length > 0 && !prestamoSeleccionadoId) {
        setPrestamoSeleccionadoId(data[0].id);
      }
    }
  };

  useEffect(() => {
    cargarPrestamos();
    cargarWallets();
  }, [familiaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acreedor.trim() || !familiaId) {
      alert('Ingresa el nombre del Banco, Entidad o Persona.');
      return;
    }

    setCargando(true);
    try {
      const orig = Number(montoOriginal) || 0;
      const pend = balancePendiente ? Number(balancePendiente) : orig;

      const payload = {
        familia_id: familiaId,
        acreedor: acreedor.trim(),
        tipo,
        monto_original: orig,
        monto_dop: pend,
        balance_pendiente: pend,
        cuotas_totales: Number(cuotasTotales) || 1,
        cuotas_pagadas: Number(cuotasPagadas) || 0,
        monto_atraso: Number(montoAtraso) || 0,
        wallet: wallet || (walletsDinamicas[0]?.nombre ?? 'Efectivo'),
        estado: pend === 0 ? 'Liquidado' : 'Activo'
      };

      const { error } = await supabase.from('prestamos').insert([payload]);

      if (error) {
        alert('Error de Supabase al guardar: ' + error.message);
      } else {
        alert('¡Préstamo registrado exitosamente!');
        setAcreedor('');
        setMontoOriginal('');
        setBalancePendiente('');
        setMontoAtraso('0');
        await cargarPrestamos();
      }
    } catch (err: any) {
      alert('Error inesperado: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const handleProcesarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prestamoSeleccionadoId || !montoPago || Number(montoPago) <= 0) return;

    const target = prestamos.find(p => p.id === prestamoSeleccionadoId);
    if (!target) return;

    setCargando(true);
    try {
      const valorAbono = Number(montoPago);
      const nuevoBalance = Math.max(0, Number(target.balance_pendiente) - valorAbono);
      const nuevasCuotas = Number(target.cuotas_pagadas) + 1;
      const nuevoAtraso = Math.max(0, Number(target.monto_atraso || 0) - valorAbono);

      const { error: err1 } = await supabase.from('prestamos').update({
        balance_pendiente: nuevoBalance,
        cuotas_pagadas: nuevasCuotas,
        monto_atraso: nuevoAtraso,
        estado: nuevoBalance === 0 ? 'Liquidado' : 'Activo'
      }).eq('id', target.id);

      if (err1) throw err1;

      const { error: err2 } = await supabase.from('presupuesto').insert([{
        familia_id: familiaId,
        fecha: new Date().toISOString().split('T')[0],
        tipo: 'Gasto',
        categoria: 'Préstamos / Deudas',
        concepto: `Pago cuota a ${target.acreedor}`,
        monto_dop: valorAbono,
        monto_original: valorAbono,
        moneda: 'DOP',
        tasa_cambio: 1,
        wallet: walletPago || 'Efectivo'
      }]);

      if (err2) throw err2;

      alert(`¡Pago de RD$ ${valorAbono.toLocaleString()} registrado con éxito!`);
      setMontoPago('');
      await cargarPrestamos();
    } catch (err: any) {
      alert('Error al procesar pago: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const eliminarPrestamo = async (id: string) => {
    if (!confirm('¿Deseas eliminar este préstamo?')) return;
    const { error } = await supabase.from('prestamos').delete().eq('id', id);
    if (error) {
      alert('Error al eliminar: ' + error.message);
    } else {
      cargarPrestamos();
    }
  };

  const totalAtrasos = prestamos
    .filter(p => p.tipo === 'Por Pagar')
    .reduce((acc, curr) => acc + Number(curr.monto_atraso || 0), 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '14px' }}>
      
      {/* Formulario */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <button
              type="button"
              onClick={() => setModoFormulario('registrar')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '800',
                fontSize: '10px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                background: modoFormulario === 'registrar' ? '#0284c7' : bgInput,
                color: modoFormulario === 'registrar' ? '#fff' : textLabel
              }}
            >
              💳 Registrar Préstamo
            </button>
            <button
              type="button"
              onClick={() => setModoFormulario('pagar')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '800',
                fontSize: '10px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                background: modoFormulario === 'pagar' ? '#10b981' : bgInput,
                color: modoFormulario === 'pagar' ? '#fff' : textLabel
              }}
            >
              💵 Pagar Cuota / Abono
            </button>
          </div>

          {modoFormulario === 'registrar' ? (
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
                  <input type="text" required value={acreedor} onChange={e => setAcreedor(e.target.value)} placeholder="Ej. Cooperativa Mamoncito..." style={inputStyle} />
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

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Wallet / Cuenta</label>
                  <select value={wallet} onChange={e => setWallet(e.target.value)} style={inputStyle}>
                    {walletsDinamicas.map(w => (
                      <option key={w.id} value={w.nombre}>{w.nombre} ({w.moneda})</option>
                    ))}
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
          ) : (
            <form onSubmit={handleProcesarPago}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Seleccionar Deuda / Préstamo a Pagar</label>
                <select value={prestamoSeleccionadoId} onChange={e => setPrestamoSeleccionadoId(e.target.value)} style={inputStyle}>
                  {prestamos.length === 0 && <option value="">No hay préstamos activos</option>}
                  {prestamos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.acreedor} (Pendiente: RD$ {Number(p.balance_pendiente).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Monto del Pago / Cuota (RD$)</label>
                  <input type="number" step="0.01" required value={montoPago} onChange={e => setMontoPago(e.target.value)} placeholder="0.00" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Pagar desde esta Wallet</label>
                  <select value={walletPago} onChange={e => setWalletPago(e.target.value)} style={inputStyle}>
                    {walletsDinamicas.map(w => (
                      <option key={w.id} value={w.nombre}>{w.nombre} ({w.moneda})</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" disabled={cargando || prestamos.length === 0} style={{ width: '100%', background: '#10b981', color: '#fff', padding: '11px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}>
                {cargando ? 'Procesando...' : 'Confirmar Pago de Cuota'}
              </button>
            </form>
          )}
        </div>

        <WalletsManager familiaId={familiaId} onWalletCambio={cargarWallets} />
      </div>

      {/* Historial */}
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
