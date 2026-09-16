import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { RegistroPatrimonio } from '../types';
import { useModoOscuro } from '../hooks/useModoOscuro';

interface PatrimonioProps {
  familiaId: string;
}

export const Patrimonio: React.FC<PatrimonioProps> = ({ familiaId }) => {
  const { bgCard, borderCard, textPrimary, textLabel, inputStyle, textTitle, bgInput } = useModoOscuro();

  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'Activo' | 'Pasivo'>('Activo');
  const [valor, setValor] = useState('');
  const [patrimonioList, setPatrimonioList] = useState<RegistroPatrimonio[]>([]);
  const [cargando, setCargando] = useState(false);

  const cargarPatrimonio = async () => {
    if (!familiaId) return;
    const { data } = await supabase
      .from('patrimonio')
      .select('*')
      .eq('familia_id', familiaId);

    if (data) setPatrimonioList(data);
  };

  useEffect(() => {
    cargarPatrimonio();
  }, [familiaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !valor) return;

    setCargando(true);
    try {
      await supabase.from('patrimonio').insert([{
        familia_id: familiaId,
        nombre,
        tipo,
        valor: Number(valor)
      }]);

      setNombre('');
      setValor('');
      cargarPatrimonio();
    } catch (err: any) {
      alert('Error guardando patrimonio: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const eliminarPatrimonio = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return;
    await supabase.from('patrimonio').delete().eq('id', id);
    cargarPatrimonio();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '14px' }}>
      {/* Formulario */}
      <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, transition: 'all 0.3s' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: textTitle }}>
          🏛️ Control de Patrimonio
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Nombre del Activo / Pasivo</label>
            <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Casa, Vehículo, Hipoteca..." style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value as any)} style={inputStyle}>
                <option value="Activo" style={{ background: bgCard, color: textPrimary }}>Activo (+)</option>
                <option value="Pasivo" style={{ background: bgCard, color: textPrimary }}>Pasivo (-)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Valor Estimado (RD$)</label>
              <input type="number" step="0.01" required value={valor} onChange={e => setValor(e.target.value)} placeholder="0.00" style={inputStyle} />
            </div>
          </div>

          <button type="submit" disabled={cargando} style={{ width: '100%', background: '#8b5cf6', color: '#fff', padding: '11px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '6px' }}>
            {cargando ? 'Guardando...' : 'Registrar Elemento'}
          </button>
        </form>
      </div>

      {/* Tabla */}
      <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, transition: 'all 0.3s' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: textTitle }}>
          📜 Lista de Activos y Pasivos
        </div>
        <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: bgInput, textTransform: 'uppercase', borderBottom: `1px solid ${borderCard}`, textAlign: 'left', color: textLabel }}>
                <th style={{ padding: '8px' }}>Nombre</th>
                <th style={{ padding: '8px' }}>Tipo</th>
                <th style={{ padding: '8px' }}>Valor (RD$)</th>
                <th style={{ padding: '8px' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {patrimonioList.map((row) => (
                <tr key={row.id} style={{ borderBottom: `1px solid ${borderCard}` }}>
                  <td style={{ padding: '8px' }}><b>{row.nombre}</b></td>
                  <td style={{ padding: '8px', color: row.tipo === 'Activo' ? '#10b981' : '#ef4444' }}>{row.tipo}</td>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>
                    RD$ {Number(row.valor).toFixed(2)}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <button onClick={() => eliminarPatrimonio(row.id!)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}>
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
  );
};

export default Patrimonio;
