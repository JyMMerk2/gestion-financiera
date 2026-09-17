import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useModoOscuro } from '../hooks/useModoOscuro';
import { WalletsManager } from './WalletsManager';
import { Trash2, Search, Edit2, X, PiggyBank } from 'lucide-react';

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

  // Estado para controlar la edición
  const [idEditando, setIdEditando] = useState<string | null>(null);

  // Estado para el buscador interactivo
  const [busqueda, setBusqueda] = useState('');

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
      const payload = {
        familia_id: familiaId,
        fecha,
        fondo: fondo.trim(),
        movimiento,
        wallet_origen: walletOrigen,
        wallet_destino: walletDestino,
        monto_dop: Number(monto),
        concepto: concepto.trim()
      };

      if (idEditando) {
        await supabase.from('ahorros').update(payload).eq('id', idEditando);
        alert('¡Registro de ahorro actualizado!');
        setIdEditando(null);
      } else {
        await supabase.from('ahorros').insert([payload]);
        alert('¡Registro de ahorro guardado!');
      }

      setMonto('');
      setConcepto('');
      cargarAhorros();
    } catch (err: any) {
      alert('Error al guardar ahorro: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const iniciarEdicion = (row: any) => {
    setIdEditando(row.id);
    setFondo(row.fondo || 'Fondo Emergencia 🚨');
    setMovimiento(row.movimiento || 'Depósito / Ahorro (+)');
    setWalletOrigen(row.wallet_origen || '');
    setWalletDestino(row.wallet_destino || '');
    setMonto(String(row.monto_dop || ''));
    setFecha(row.fecha || new Date().toISOString().split('T')[0]);
    setConcepto(row.concepto || '');
  };

  const cancelarEdicion = () => {
    setIdEditando(null);
    setMonto('');
    setConcepto('');
  };

  const eliminarRegistro = async (id: string) => {
    if (!confirm('¿Deseas eliminar este registro de ahorro?')) return;
    await supabase.from('ahorros').delete().eq('id', id);
    cargarAhorros();
  };

  // Sugerencias autocompletables
  const sugerenciasBusqueda = Array.from(
    new Set([
      ...ahorros.map(a => a.fondo).filter(Boolean),
      ...ahorros.map(a => a.concepto).filter(Boolean),
      ...ahorros.map(a => a.movimiento).filter(Boolean),
      ...ahorros.map(a => a.wallet_origen).filter(Boolean),
      ...ahorros.map(a => a.wallet_destino).filter(Boolean)
    ])
  );

  // Filtrado de ahorros
  const ahorrosFiltrados = ahorros.filter(row => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      (row.fondo && row.fondo.toLowerCase().includes(q)) ||
      (row.concepto && row.concepto.toLowerCase().includes(q)) ||
      (row.movimiento && row.movimiento.toLowerCase().includes(q)) ||
      (row.wallet_origen && row.wallet_origen.toLowerCase().includes(q)) ||
      (row.wallet_destino && row.wallet_destino.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
      
      {/* Columna Izquierda: Formulario + Administrador de Wallets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        <div style={{ background: bgCard, border: `1px solid ${idEditando ? '#ffea00' : borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, transition: 'all 0.3s' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: idEditando ? '#ffea00' : textTitle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PiggyBank size={14} color={idEditando ? '#ffea00' : '#00e5ff'} />
              {idEditando ? '✏️ Editando Fondo de Ahorro' : '🏦 Registrar Fondo de Ahorro'}
            </span>
            {idEditando && (
              <button onClick={cancelarEdicion} style={{ background: 'transparent', border: 'none', color: '#ff007f', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px', fontWeight: 'bold' }}>
                <X size={12} /> Cancelar
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '8px' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '8px' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '8px' }}>
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

            <button type="submit" disabled={cargando} style={{ width: '100%', background: idEditando ? '#ffea00' : (esOscuro ? '#00e5ff' : '#4f46e5'), color: idEditando || esOscuro ? '#0a0e14' : '#fff', padding: '11px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '6px' }}>
              {cargando ? 'Guardando...' : (idEditando ? 'Actualizar Ahorro' : 'Registrar Ahorro')}
            </button>
          </form>
        </div>

        {/* Administrador Dinámico de Wallets */}
        <WalletsManager familiaId={familiaId} onWalletCambio={cargarWallets} />

      </div>

      {/* Columna Derecha: Historial con Buscador */}
      <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, transition: 'all 0.3s' }}>
        
        <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px', color: textTitle }}>
          📈 Historial de Ahorros
        </div>

        {/* Buscador Interactivo */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: bgInput, border: `1px solid ${borderCard}`, borderRadius: '8px', padding: '6px 10px', gap: '8px' }}>
            <Search size={14} color={textLabel} />
            <input
              type="text"
              list="sugerencias-ahorros"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por fondo, concepto o movimiento..."
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

          <datalist id="sugerencias-ahorros">
            {sugerenciasBusqueda.map((sug, i) => (
              <option key={i} value={sug} />
            ))}
          </datalist>
        </div>

        <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
          {ahorrosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: textLabel, fontSize: '11px' }}>
              {busqueda ? `Sin resultados para "${busqueda}"` : 'Sin registros de ahorro en este mes.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: bgInput, textTransform: 'uppercase', borderBottom: `1px solid ${borderCard}`, textAlign: 'left', color: textLabel }}>
                  <th style={{ padding: '8px' }}>Fecha</th>
                  <th style={{ padding: '8px' }}>Meta / Fondo</th>
                  <th style={{ padding: '8px' }}>Tipo</th>
                  <th style={{ padding: '8px' }}>Total RD$</th>
                  <th style={{ padding: '8px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ahorrosFiltrados.map((row) => (
                  <tr key={row.id} style={{ borderBottom: `1px solid ${borderCard}`, background: idEditando === row.id ? 'rgba(255, 234, 0, 0.1)' : 'transparent' }}>
                    <td style={{ padding: '8px', color: textLabel }}>{row.fecha}</td>
                    <td style={{ padding: '8px' }}><b>{row.fondo}</b><br/><small style={{ color: textLabel }}>{row.concepto}</small></td>
                    <td style={{ padding: '8px' }}>{row.movimiento}</td>
                    <td style={{ padding: '8px', color: row.movimiento?.includes('Depósito') ? '#00ff41' : '#ff007f', fontWeight: 'bold' }}>
                      RD$ {Number(row.monto_dop).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => iniciarEdicion(row)} title="Editar registro" style={{ background: 'transparent', border: 'none', color: '#ffea00', cursor: 'pointer' }}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => eliminarRegistro(row.id!)} title="Eliminar registro" style={{ background: 'transparent', border: 'none', color: '#ff007f', cursor: 'pointer' }}>
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
  );
};

export default Ahorros;
