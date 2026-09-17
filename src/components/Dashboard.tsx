import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { TransaccionPresupuesto } from '../types';
import { TrendingUp, TrendingDown, Coins, Eye, EyeOff, LogOut, ChevronLeft, ChevronRight, CreditCard, Building2, Landmark, Wallet } from 'lucide-react';

interface DashboardProps {
  perfil: any;
  onLogout: () => void;
  onNavigate: (seccion: string) => void;
  modoOscuro?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ perfil, onLogout, modoOscuro = false }) => {
  // Modo Privacidad activado por defecto
  const [modoPrivacidad, setModoPrivacidad] = useState(true);
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
  
  // Estructura de 12 meses registrando Ingresos y Gastos de forma independiente
  const [historial12Meses, setHistorial12Meses] = useState<{ mes: string; label: string; ingresos: number; gastos: number }[]>([]);

  // Estilos
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
    const familiaId = perfil?.familia_id || perfil?.familias?.id;
    if (!familiaId) return;

    const cargarMetricas = async () => {
      // 1. Wallets
      const { data: wallData } = await supabase
        .from('wallets')
        .select('*')
        .eq('familia_id', familiaId);

      let mapWallets: Record<string, number> = {};
      if (wallData && wallData.length > 0) {
        wallData.forEach((w: any) => {
          mapWallets[w.nombre] = Number(w.balance || 0);
        });
      }

      // Estructurar los últimos 12 meses
      const mesesLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const fechaActual = new Date();
      let temp12Meses: { mes: string; label: string; ingresos: number; gastos: number }[] = [];

      for (let i = 11; i >= 0; i--) {
        const d = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        temp12Meses.push({
          mes: key,
          label: mesesLabels[d.getMonth()],
          ingresos: 0,
          gastos: 0
        });
      }

      // 2. Presupuesto
      const { data: presData } = await supabase
        .from('presupuesto')
        .select('*')
        .eq('familia_id', familiaId);

      let ing = 0, gas = 0;
      let ultimas: TransaccionPresupuesto[] = [];

      if (presData) {
        presData.forEach((row: TransaccionPresupuesto) => {
          const montoNum = Number(row.monto_dop || 0);
          const factor = row.tipo === 'Ingreso' ? 1 : -1;
          const wNombre = row.wallet || 'Efectivo';
          mapWallets[wNombre] = (mapWallets[wNombre] || 0) + (montoNum * factor);

          // Acumular separadamente Ingresos y Gastos por mes
          const mesRow = row.fecha.substring(0, 7);
          const mesObj = temp12Meses.find(m => m.mes === mesRow);
          if (mesObj) {
            if (row.tipo === 'Ingreso') mesObj.ingresos += montoNum;
            else mesObj.gastos += montoNum;
          }

          if (row.fecha.startsWith(mesSeleccionado)) {
            if (row.tipo === 'Ingreso') ing += montoNum;
            else gas += montoNum;
            ultimas.push(row);
          }
        });
      }

      // 3. Patrimonio (Aportes de inversión/patrimonio sumados a ingresos del mes)
      const { data: patData } = await supabase
        .from('patrimonio')
        .select('*')
        .eq('familia_id', familiaId);

      let bienes = 0;
      if (patData) {
        patData.forEach((b: any) => {
          const valorPat = Number(b.valor_dop ?? b.valor ?? b.monto ?? 0);
          bienes += valorPat;

          const fechaPat = b.fecha || b.fecha_registro;
          if (fechaPat) {
            const mesPat = fechaPat.substring(0, 7);
            const mesObj = temp12Meses.find(m => m.mes === mesPat);
            if (mesObj) {
              mesObj.ingresos += valorPat;
            }
          }
        });
      }

      setHistorial12Meses(temp12Meses);
      setIngresosMes(ing);
      setGastosMes(gas);
      setAhorroMes(ing - gas);
      setWalletsBalances(mapWallets);
      setUltimasTransacciones(ultimas.slice(-5).reverse());

      // 4. Préstamos
      const { data: prestData } = await supabase
        .from('prestamos')
        .select('*')
        .eq('familia_id', familiaId);

      let deudas = 0;
      if (prestData) {
        prestData.forEach((p: any) => {
          const esDeuda = p.tipo === 'Por Pagar' || p.tipo === 'Deuda' || !p.tipo;
          if (esDeuda && p.estado !== 'Liquidado') {
            const pend = p.balance_pendiente ?? p.monto ?? p.monto_original ?? 0;
            deudas += Number(pend);
          }
        });
      }
      setDeudasTotales(deudas);

      const totalWallets = Object.values(mapWallets).reduce((a, b) => a + b, 0);
      setDisponibleReal(totalWallets);
      setPatrimonioNeto(totalWallets + bienes - deudas);
    };

    cargarMetricas();
  }, [perfil, mesSeleccionado]);

  const blurStyle = modoPrivacidad ? { filter: 'blur(6px)', opacity: 0.35, userSelect: 'none' as const } : {};

  // Cálculo del monto máximo global para la escala de alturas
  const maxMontoGlobal = Math.max(
    ...historial12Meses.map(m => Math.max(m.ingresos, m.gastos)),
    1000
  );

  return (
    <div style={{ paddingBottom: '30px' }}>
      
      {/* Encabezado Superior */}
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Ocultar / Mostrar montos"
          >
            {modoPrivacidad ? <EyeOff size={18} /> : <Eye size={18} />}
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '900', margin: 0, color: textPrimary }}>
            Hola, {perfil?.nombre_usuario?.toUpperCase() || perfil?.nombre?.toUpperCase() || perfil?.email?.split('@')[0]?.toUpperCase() || 'USUARIO'}
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
          <button onClick={() => cambiarMes(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textPrimary, display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: '12px', fontWeight: '800', minWidth: '80px', textAlign: 'center' }}>{obtenerNombreMes(mesSeleccionado)}</span>
          <button onClick={() => cambiarMes(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textPrimary, display: 'flex', alignItems: 'center' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Bloque 1: Ingresos, Gastos y Ahorro Neto */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', background: cardBg, borderRadius: '18px', padding: '20px', border: `1px solid ${cardBorder}`, marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: '800', color: textSecondary, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <TrendingUp size={14} color="#10b981" /> INGRESOS
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#10b981', ...blurStyle }}>
            RD$ {ingresosMes.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '10px', fontWeight: '800', color: textSecondary, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <TrendingDown size={14} color="#ef4444" /> GASTOS
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#ef4444', ...blurStyle }}>
            RD$ {gastosMes.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '10px', fontWeight: '800', color: textSecondary, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Coins size={14} color="#0284c7" /> AHORRO NETO
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: textPrimary, ...blurStyle }}>
            RD$ {ahorroMes.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Bloque 2: Gráfica de Doble Barra (Ingresos vs. Gastos) por Mes */}
      <div style={{ background: cardBg, borderRadius: '18px', padding: '20px', border: `1px solid ${cardBorder}`, marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px', color: textPrimary }}>
          Flujo de dinero (Ingresos vs. Gastos) — últimos 12 meses
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px', alignItems: 'flex-end', height: '110px', borderBottom: `1px solid ${cardBorder}`, paddingBottom: '8px' }}>
          {historial12Meses.map((m, idx) => {
            const hIngreso = m.ingresos > 0 ? Math.max(8, Math.min(65, Math.round((m.ingresos / maxMontoGlobal) * 65))) : 4;
            const hGasto = m.gastos > 0 ? Math.max(8, Math.min(65, Math.round((m.gastos / maxMontoGlobal) * 65))) : 4;

            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', width: '100%', justifyContent: 'center' }}>
                  {/* Barra Verde - Ingresos / Entradas */}
                  <div 
                    style={{
                      flex: 1,
                      maxWidth: '10px',
                      height: `${hIngreso}px`,
                      borderRadius: '3px 3px 0 0',
                      background: m.ingresos > 0 ? '#10b981' : (modoOscuro ? '#334155' : '#e2e8f0'),
                      transition: 'all 0.3s ease'
                    }}
                    title={`${m.label} Ingresos: RD$ ${m.ingresos.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                  />
                  {/* Barra Roja - Gastos / Salidas */}
                  <div 
                    style={{
                      flex: 1,
                      maxWidth: '10px',
                      height: `${hGasto}px`,
                      borderRadius: '3px 3px 0 0',
                      background: m.gastos > 0 ? '#ef4444' : (modoOscuro ? '#334155' : '#e2e8f0'),
                      transition: 'all 0.3s ease'
                    }}
                    title={`${m.label} Gastos: RD$ ${m.gastos.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                  />
                </div>
                <span style={{ fontSize: '9px', fontWeight: m.mes === mesSeleccionado ? 'bold' : 'normal', color: m.mes === mesSeleccionado ? textPrimary : textSecondary, marginTop: '8px' }}>
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '10px', fontWeight: 'bold' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
            <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '2px' }}></span> Ingresos / Entradas
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}>
            <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '2px' }}></span> Gastos / Salidas
          </span>
        </div>
      </div>

      {/* Bloque 3: Últimas Transacciones del Mes */}
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
                  {t.tipo === 'Ingreso' ? '+' : '-'} RD$ {Number(t.monto_dop).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bloque 4: Indicadores Generales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '14px', padding: '14px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '9px', fontWeight: '800', color: textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CreditCard size={12} color="#ef4444" /> DEUDAS PENDIENTES
          </div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: textPrimary, marginTop: '4px', ...blurStyle }}>
            RD$ {deudasTotales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '14px', padding: '14px', borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: '9px', fontWeight: '800', color: textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Building2 size={12} color="#6366f1" /> PATRIMONIO NETO
          </div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: textPrimary, marginTop: '4px', ...blurStyle }}>
            RD$ {patrimonioNeto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '14px', padding: '14px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '9px', fontWeight: '800', color: textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Landmark size={12} color="#10b981" /> DISPONIBLE REAL
          </div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: textPrimary, marginTop: '4px', ...blurStyle }}>
            RD$ {disponibleReal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Bloque 5: Balance por Cuentas / Wallets */}
      <div style={{ fontSize: '11px', fontWeight: '800', marginBottom: '10px', color: textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Wallet size={14} /> BALANCE POR CUENTAS / WALLETS
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
        {Object.keys(walletsBalances).length === 0 ? (
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '12px', padding: '12px', color: textSecondary, fontSize: '12px', gridColumn: '1 / -1' }}>
            No hay transacciones ni wallets registradas.
          </div>
        ) : (
          Object.keys(walletsBalances).map((wKey) => (
            <div key={wKey} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '12px', padding: '12px', borderTop: `4px solid ${modoOscuro ? '#38bdf8' : '#111827'}` }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: textSecondary }}>{wKey}</div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: textPrimary, marginTop: '2px', ...blurStyle }}>
                RD$ {walletsBalances[wKey].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default Dashboard;
