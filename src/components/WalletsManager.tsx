import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useModoOscuro } from '../hooks/useModoOscuro';
import { Wallet, Plus, Trash2 } from 'lucide-react';

interface WalletItem {
  id?: string;
  familia_id?: string | null;
  user_id?: string | null;
  nombre: string;
  tipo?: string;
  balance?: number;
  balance_inicial?: number;
  balance_actual?: number;
  moneda: string;
}

interface WalletsManagerProps {
  familiaId?: string;
  onWalletCambio?: () => void;
}

export const WalletsManager: React.FC<WalletsManagerProps> = ({ familiaId, onWalletCambio }) => {
  const { bgCard, borderCard, textPrimary, textLabel, inputStyle, textTitle, bgInput, esOscuro } = useModoOscuro();

  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [nombre, setNombre] = useState('');
  const [balance, setBalance] = useState('');
  const [moneda, setMoneda] = useState<'RD$' | 'USD'>('RD$');
  const [cargando, setCargando] = useState(false);

  const cargarWallets = useCallback(async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    let query = supabase.from('wallets').select('*');

    if (familiaId) {
      query = query.or(`user_id.eq.${user.id},familia_id.eq.${familiaId}`);
    } else {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (!error && data) {
      setWallets(data);
    }
  }, [familiaId]);

  useEffect(() => {
    cargarWallets();
  }, [cargarWallets]);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setCargando(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Usuario no autenticado.');

      // Obtener familia_id de perfiles
      const { data: perfilData } = await supabase
        .from('perfiles')
        .select('familia_id')
        .eq('id', user.id)
        .single();

      const montoNum = balance ? Number(balance) : 0;
      const famIdFinal = perfilData?.familia_id || (familiaId && familiaId !== user.id ? familiaId : null);

      const payload = {
        user_id: user.id,
        familia_id: famIdFinal,
        nombre: nombre.trim(),
        tipo: 'Banco',
        balance: montoNum,
        balance_inicial: montoNum,
        balance_actual: montoNum,
        moneda
      };

      const { error } = await supabase.from('wallets').insert([payload]);

      if (error) {
        alert('Error al crear wallet: ' + error.message);
      } else {
        setNombre('');
        setBalance('');
        await cargarWallets();
        if (onWalletCambio) onWalletCambio();
      }
    } catch (err: any) {
      alert('Error inesperado: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta wallet/cuenta?')) return;
    const { error } = await supabase.from('wallets').delete().eq('id', id);
    if (!error) {
      await cargarWallets();
      if (onWalletCambio) onWalletCambio();
    } else {
      alert('Error al eliminar: ' + error.message);
    }
  };

  return (
    <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, marginTop: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: textTitle }}>
        <Wallet size={14} color="#00e5ff" /> 💳 Crear / Administrar Cuentas y Wallets
      </div>

      {/* Formulario de creación de Wallet */}
      <form onSubmit={handleCrear} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 80px 40px', gap: '8px', marginBottom: '12px' }}>
        <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. BHD, Banreservas, Efectivo..." style={inputStyle} />
        <input type="number" step="0.01" value={balance} onChange={e => setBalance(e.target.value)} placeholder="Balance Inicial" style={inputStyle} />
        <select value={moneda} onChange={e => setMoneda(e.target.value as any)} style={{ ...inputStyle, fontWeight: 'bold' }}>
          <option value="RD$" style={{ background: bgCard, color: textPrimary }}>RD$</option>
          <option value="USD" style={{ background: bgCard, color: textPrimary }}>USD$</option>
        </select>
        <button type="submit" disabled={cargando} style={{ background: esOscuro ? '#00e5ff' : '#0284c7', color: esOscuro ? '#0a0e14' : '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={16} />
        </button>
      </form>

      {/* Grid de Wallets creadas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
        {wallets.length === 0 ? (
          <span style={{ fontSize: '11px', color: textLabel }}>No hay cuentas personalizadas creadas aún.</span>
        ) : (
          wallets.map(w => {
            const montoMostrar = Number(w.balance ?? w.balance_inicial ?? w.balance_actual ?? 0);
            return (
              <div key={w.id} style={{ background: bgInput, border: `1px solid ${borderCard}`, borderRadius: '10px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', display: 'block' }}>{w.nombre}</span>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#00e5ff' }}>{w.moneda} {montoMostrar.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
                <button onClick={() => handleEliminar(w.id!)} style={{ background: 'transparent', border: 'none', color: '#ff007f', cursor: 'pointer' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default WalletsManager;
