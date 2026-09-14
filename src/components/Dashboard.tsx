import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { TransaccionPresupuesto, RegistroPatrimonio, RegistroPrestamo } from '../types';

interface DashboardProps {
  perfil: any;
  onLogout: () => void;
  onNavigate: (seccion: string) => void;
  modoOscuro?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ perfil, onLogout, modoOscuro = false }) => {
  const [modoPrivacidad, setModoPrivacidad] = useState(false);
  const [mesSeleccionado, setMesSeleccionado] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [ingresosMes, setIngresosMes] = useState(0);
  const [gastosMes, setGastosMes] = useState(0);
  const [ahorroMes, setAhorroMes] = useState(0);

  const [deudasTotales, setDeudasTotales] = useState(0);
  const [patrimonioNeto, setPatrimonioNeto] = useState(0);
  const [disponibleReal, setDisponibleReal] = useState(0);

  const [ultimasTransacciones, setUltimasTransacciones] = useState<TransaccionPresupuesto[]>([]);
  const [walletsBalances, setWalletsBalances] = useState<Record<string, number>>({});

  // Paleta de colores según Modo Oscuro / Claro
  const cardBg = modoOscuro ? '#1e293b' : '#ffffff';
  const cardBorder = modoOscuro ? '#334155' : '#e5e7eb';
  const innerBg = modoOscuro ? '#0f172a' : '#f9fafb';
  const textPrimary = modoOscuro ? '#f8fafc' : '#111827';
  const textSecondary = modoOscuro ? '#cbd5e1' : '#6b7280';

  const cambiarMes = (delta: number) => {
    const [year, month] = mesSeleccionado.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    setMesSeleccionado(`${newYear}-${newMonth}`);
  };

  const obtenerNombreMes = (mesStr: string) => {
    const [year, month] = mesStr.split('-');
    const nombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${nombres[parseInt(month, 10) - 1]} ${year}`;
  };

  useEffect(() => {
    if (!perfil?.familia_id) return;

    const cargarMetricas = async () => {
      const { data: presData } = await supabase
        .from('presupuesto')
        .select('*')
        .eq('familia_id', perfil.familia_id);

      let ing = 0, gas = 0;
      let wallets: Record<string, number> = {};
      let ultimas: TransaccionPresupuesto[] = [];

      if (presData) {
        presData.forEach((row: TransaccionPresupuesto) => {
          const factor = row.tipo === 'Ingreso' ? 1 : -1;
          wallets[row.wallet] = (wallets[row.wallet] || 0) + (row.monto_dop * factor);

          if (row.fecha.startsWith(mesSeleccionado)) {
            if (row.tipo === 'Ingreso') ing += Number(row.monto_dop);
            else gas += Number(row.monto_dop);
            ultimas.push(row);
          }
        });
      }

      setIngresosMes(ing);
      setGastosMes(gas);
      setAhorroMes(ing - gas);
      setWalletsBalances(wallets);
      setUltimasTransacciones(ultimas.slice(-5).reverse());

      const { data: prestData } = await supabase
        .from('prestamos')
        .select('*')
        .eq('familia_id', perfil.familia_id);

      let deudas = 0;
      if (prestData) {
        prestData.forEach((p: RegistroPrestamo) => {
          if (p.tipo === 'Nueva Deuda') deudas += Number(p.monto);
          else if (p.tipo === 'Pago Cuota') deudas = Math.max(0, deudas - Number(p.monto));
        });
      }
      setDeudasTotales(deudas);

      const { data: patData } = await supabase
        .from('patrimonio')
        .select('*')
        .eq('familia_id', perfil.familia_id);

      let bienes = 0;
      if (patData) {
        patData.forEach((b: RegistroPatrimonio) => bienes += Number(b.valor_dop));
      }

      const totalWallets = Object.values(wallets).reduce((a, b) => a + b, 0);
      setDisponibleReal(totalWallets);
      setPatrimonioNeto(totalWallets + bienes - deudas);
    };

    cargarMetricas();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => cargarMetricas())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [perfil, mesSeleccionado]);

  const blurStyle = modoPrivacidad ? { filter: 'blur(6px)', opacity: 0.35, userSelect: 'none' as const } : {};

  return (
    <div style={{ paddingBottom: '30px' }}>
      
      {/* Encabezado Superior con Acciones y Saludo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setModoPrivacidad(!modoPrivacidad)}
            style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '12px', 
              border: `1px solid ${cardBorder}`, 
              background: cardBg, 
              color: textPrimary,
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Ocultar / Mostrar montos"
          >
            {modoPrivacidad ? '🙈' : '👁️'}
          </button>
          <button
            onClick={onLogout}
            style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '12px', 
              border: 'none', 
              background: 'rgba(239, 68, 68, 0.12)', 
              color: '#ef4444', 
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Cerrar sesión"
          >
            🚪
          </button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '900', margin: 0, color: textPrimary }}>
            Hola, {perfil?.nombre_usuario?.toUpperCase() || perfil?.email?.split('@')[0]?.toUpperCase() || 'USUARIO'}
          </h1>
          <p style={{ fontSize: '11px', color: textSecondary, margin: '2px 0 0 0', fontWeight: '600' }}>
            {perfil?.familias?.nombre || 'Familia'} • Código: <b style={{ color: '#38bdf8' }}>{perfil?.familias?.codigo_invitacion || 'N/A'}</b>
          </p>
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: cardBg, 
          border: `1px solid ${cardBorder}`, 
          borderRadius: '9999px', 
          padding: '4px 14px', 
          gap: '12px',
          color: textPrimary
        }}>
          <button onClick={() => cambiarMes(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: textPrimary }}>❮</button>
          <span style={{ fontSize: '12px', fontWeight: '800', minWidth: '80px', textAlign: 'center' }}>{obtenerNombreMes(mesSeleccionado)}</span>
          <button onClick={() => cambiarMes(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: textPrimary }}>❯</button>
        </div>
      </div>

      {/* Bloque 1: Ingresos, Gastos y Ahorro Neto */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', background: cardBg, borderRadius: '18px', padding: '20px', border: `1px solid ${cardBorder}`, marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: '800', color: textSecondary }}>📈 INGRESOS</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#10b981', ...blurStyle }}>RD$ {ingresosMes.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>
        <div>
          <div style={{ fontSize: '10px', fontWeight: '800', color: textSecondary }}>📉 GASTOS</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#ef4444', ...blurStyle }}>RD$ {gastosMes.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>
        <div>
          <div style={{ fontSize: '10px', fontWeight: '800', color: textSecondary }}>🪙 AHORRO NETO</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: textPrimary, ...blurStyle }}>RD$ {ahorroMes.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Bloque 2: Últimas Transacciones del Mes */}
      <div style={{ background: cardBg, borderRadius: '18px', padding: '20px', border: `1px solid ${cardBorder}`, marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '12px', color: textPrimary }}>Últimas transacciones del mes</div>
        {ultimasTransacciones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: textSecondary, fontSize: '13px', fontWeight: '700' }}>
            📉 Sin movimientos en este mes
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ultimasTransacciones.map((t, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: innerBg, borderRadius: '10px', border: `1px solid ${cardBorder}` }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: textPrimary }}>{t.concepto || t.categoria}</div>
                  <div style={{ fontSize: '9px', color: textSecondary }}>{t.fecha} • {t.wallet}</div>
                </div>
                <div style={{ fontSize: '12px', fontWeight: '900', color: t.tipo === 'Ingreso' ? '#10b981' : '#ef4444', ...blurStyle }}>
                  {t.tipo === 'Ingreso' ? '+' : '-'} RD$ {Number(t.monto_dop).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bloque 3: Indicadores Generales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '14px', padding: '14px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '9px', fontWeight: '800', color: textSecondary }}>DEUDAS PENDIENTES</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: textPrimary, marginTop: '4px', ...blurStyle }}>RD$ {deudasTotales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '14px', padding: '14px', borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: '9px', fontWeight: '800', color: textSecondary }}>PATRIMONIO NETO</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: textPrimary, marginTop: '4px', ...blurStyle }}>RD$ {patrimonioNeto.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '14px', padding: '14px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '9px', fontWeight: '800', color: textSecondary }}>DISPONIBLE REAL</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: textPrimary, marginTop: '4px', ...blurStyle }}>RD$ {disponibleReal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Bloque 4: Balance por Cuentas / Wallets */}
      <div style={{ fontSize: '11px', fontWeight: '800', marginBottom: '10px', color: textPrimary }}>💳 BALANCE POR CUENTAS / WALLETS</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
        {Object.keys(walletsBalances).length === 0 ? (
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '12px', padding: '12px', color: textSecondary, fontSize: '12px', gridColumn: '1 / -1' }}>
            No hay transacciones registradas para calcular wallets.
          </div>
        ) : (
          Object.keys(walletsBalances).map((wKey) => (
            <div key={wKey} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '12px', padding: '12px', borderTop: `4px solid ${modoOscuro ? '#38bdf8' : '#111827'}` }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: textSecondary }}>{wKey}</div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: textPrimary, marginTop: '2px', ...blurStyle }}>
                RD$ {walletsBalances[wKey].toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
