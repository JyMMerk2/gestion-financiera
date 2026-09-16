import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useModoOscuro } from '../hooks/useModoOscuro';
import { Wallet, Plus, Trash2 } from 'lucide-react';

interface WalletItem {
  id?: string;
  familia_id: string;
  nombre: string;
  tipo: string;
  balance: number;
  moneda: string;
}

export const WalletsManager: React.FC<{ familiaId: string }> = ({ familiaId }) => {
  const { bgCard, borderCard, textPrimary, textLabel, inputStyle, textTitle, bgInput } = useModoOscuro();

  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [nombre, setNombre] = useState('');
  const [balance, setBalance] = useState('');
  const [moneda, setMoneda] = useState<'RD$' | 'USD'>('RD$');
  const [cargando, setCargando] = useState(false);

  const cargarWallets = async () => {
    if (!familiaId) return;
    const { data } = await supabase.from('wallets').select('*').eq('familia_id', familiaId);
    if (data) setWallets(data);
  };

  useEffect(() => {
    cargarWallets();
  }, [familiaId]);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !familiaId) return;

    setCargando(true);
    await supabase.from('wallets').insert([{
      familia_id: familiaId,
      nombre: nombre.trim(),
      balance: balance ? Number(balance) : 0,
      moneda
    }]);

    setNombre('');
    setBalance('');
    setCargando(false);
    cargarWallets();
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta wallet?')) return;
    await supabase.from('wallets').delete().eq('id', id);
    cargarWallets();
  };

  return (
    <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, marginTop: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: textTitle }}>
        <Wallet size={14} /> 💳 Mis Wallets y Cuentas Bancarias
      </div>

      {/* Formulario de creación de Wallet */}
      <form onSubmit={handleCrear} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 80px 40px', gap: '8px', marginBottom: '12px' }}>
        <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Banreservas, Efectivo..." style={inputStyle} />
        <input type="number" step="0.01" value={balance} onChange={e => setBalance(e.target.value)} placeholder="Balance Inicial" style={inputStyle} />
        <select value={moneda} onChange={e => setMoneda(e.target.value as any)} style={{ ...inputStyle, fontWeight: 'bold' }}>
          <option value="RD$">RD$</option>
          <option value="USD">USD$</option>
        </select>
        <button type="submit" disabled={cargando} style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={16} />
        </button>
      </form>

      {/* Grid de Wallets creadas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
        {wallets.map(w => (
          <div key={w.id} style={{ background: bgInput, border: `1px solid ${borderCard}`, borderRadius: '10px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 'bold', display: 'block' }}>{w.nombre}</span>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#0284c7' }}>{w.moneda} {Number(w.balance).toLocaleString()}</span>
            </div>
            <button onClick={() => handleEliminar(w.id!)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
