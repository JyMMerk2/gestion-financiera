import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { RegistroPatrimonio } from '../types';
import { useModoOscuro } from '../hooks/useModoOscuro';

interface PatrimonioProps {
  familiaId: string;
}

export const Patrimonio: React.FC<PatrimonioProps> = ({ familiaId }) => {
  const { bgCard, borderCard, textPrimary, textLabel, inputStyle, esOscuro } = useModoOscuro();

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

  const textTitle = esOscuro ? '#a78bfa' : '#8b5cf6';

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '14px' }}>
        
        {/* Formulario */}
        <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, transition: 'all 0.3s' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: textTitle }}>
            💎 Registrar Activo / Bien
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Nombre del Bien</label>
              <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Terreno, Vehículo, Joyas..." style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Valor Estimado (RD$)</label>
                <input type="number" step="0.01" required value={valor} onChange={e => setValor(e.target.value)} placeholder="0.00" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Fecha Registro</label>
                <input type="date" required value={fecha} onChange={e => setFecha(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Foto / Referencia (Opcional)</label>
              <input type="text" value={fotoUrl} onChange={e => setFotoUrl(e.target.value)} placeholder="Ej. URL de la foto..." style={inputStyle} />
            </div>

            <button type="submit" disabled={cargando} style={{ width: '100%', background: '#8b5cf6', color: '#fff', padding: '11px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '6px' }}>
              {cargando ? 'Guardando...' : 'Registrar Patrimonio'}
            </button>
          </form>
        </div>

        {/* Historial */}
        <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, transition: 'all 0.3s' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: textTitle }}>
            🏛️ Historial de Patrimonio
          </div>
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: inputStyle.background as string, textTransform: 'uppercase', borderBottom: `1px solid ${borderCard}`, textAlign: 'left', color: textLabel }}>
                  <th style={{ padding: '8px' }}>Fecha</th>
                  <th style={{ padding: '8px' }}>Bien / Activo</th>
                  <th style={{ padding: '8px' }}>Valor (RD$)</th>
                  <th style={{ padding: '8px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {patrimonioList.map((row) => (
                  <tr key={row.id} style={{ borderBottom: `1px solid ${borderCard}` }}>
                    <td style={{ padding: '8px', color: textLabel }}>{row.fecha}</td>
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
