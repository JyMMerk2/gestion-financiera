import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { RegistroPatrimonio } from '../types';

interface PatrimonioProps {
  familiaId: string;
}

export const Patrimonio: React.FC<PatrimonioProps> = ({ familiaId }) => {
  const [nombre, setNombre] = useState('');
  const [valor, setValor] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [fotoUrl, setFotoUrl] = useState('');

  const [patrimonioList, setPatrimonioList] = useState<RegistroPatrimonio[]>([]);
  const [cargando, setCargando] = useState(false);

  const cargarPatrimonio = async () => {
    if (!familiaId) return;
    const { data } = await supabase
      .from('patrimonio')
      .select('*')
      .eq('familia_id', familiaId)
      .order('fecha', { ascending: false });

    if (data) setPatrimonioList(data);
  };

  useEffect(() => {
    cargarPatrimonio();
  }, [familiaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valor || Number(valor) <= 0) return;

    setCargando(true);
    try {
      await supabase.from('patrimonio').insert([{
        familia_id: familiaId,
        fecha,
        nombre,
        valor_dop: Number(valor),
        foto_url: fotoUrl
      }]);

      setNombre('');
      setValor('');
      setFotoUrl('');
      cargarPatrimonio();
    } catch (err: any) {
      alert('Error al guardar en patrimonio: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const eliminarBien = async (id: string) => {
    if (!confirm('¿Deseas eliminar este activo del patrimonio?')) return;
    await supabase.from('patrimonio').delete().eq('id', id);
    cargarPatrimonio();
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '14px' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>
            💎 Registrar Activo / Bien
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#6b7280', marginBottom: '3px' }}>Nombre del Bien</label>
              <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Terreno, Vehículo, Joyas..." style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#6b7280', marginBottom: '3px' }}>Valor Estimado (RD$)</label>
                <input type="number" step="0.01" required value={valor} onChange={e => setValor(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#6b7280', marginBottom: '3px' }}>Fecha Registro</label>
                <input type="date" required value={fecha} onChange={e => setFecha(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb' }} />
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#6b7280', marginBottom: '3px' }}>Foto / Referencia (Opcional)</label>
              <input type="text" value={fotoUrl} onChange={e => setFotoUrl(e.target.value)} placeholder="Ej. URL de la foto..." style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb' }} />
            </div>

            <button type="submit" disabled={cargando} style={{ width: '100%', background: '#8b5cf6', color: '#fff', padding: '11px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '6px' }}>
              {cargando ? 'Guardando...' : 'Registrar Patrimonio'}
            </button>
          </form>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>
            🏛️ Historial de Patrimonio
          </div>
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#f9fafb', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Fecha</th>
                  <th style={{ padding: '8px' }}>Bien / Activo</th>
                  <th style={{ padding: '8px' }}>Valor (RD$)</th>
                  <th style={{ padding: '8px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {patrimonioList.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px' }}>{row.fecha}</td>
                    <td style={{ padding: '8px' }}><b>{row.nombre}</b></td>
                    <td style={{ padding: '8px', color: '#8b5cf6', fontWeight: 'bold' }}>
                      RD$ {Number(row.valor_dop).toFixed(2)}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <button onClick={() => eliminarBien(row.id!)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}>
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
