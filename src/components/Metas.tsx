import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useModoOscuro } from '../hooks/useModoOscuro';
import { ExternalLink } from 'lucide-react';

interface MetasProps {
  familiaId: string;
}

interface ItemMeta {
  id?: string;
  familia_id: string;
  categoria: 'Solar / Casa' | 'Bebé 2027' | 'General';
  titulo: string;
  completado: boolean;
  precio?: number;
  enlace?: string;
}

export const Metas: React.FC<MetasProps> = ({ familiaId }) => {
  const { bgCard, borderCard, textPrimary, textLabel, inputStyle, textTitle, bgInput } = useModoOscuro();

  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<'Solar / Casa' | 'Bebé 2027' | 'General'>('Solar / Casa');
  const [precio, setPrecio] = useState('');
  const [enlace, setEnlace] = useState('');

  const [metas, setMetas] = useState<ItemMeta[]>([]);
  const [cargando, setCargando] = useState(false);

  const cargarMetas = async () => {
    if (!familiaId) return;
    const { data } = await supabase
      .from('metas')
      .select('*')
      .eq('familia_id', familiaId)
      .order('created_at', { ascending: true });

    if (data) setMetas(data);
  };

  useEffect(() => {
    cargarMetas();
  }, [familiaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    setCargando(true);
    try {
      await supabase.from('metas').insert([{
        familia_id: familiaId,
        categoria,
        titulo: titulo.trim(),
        completado: false,
        precio: precio ? Number(precio) : 0,
        enlace: enlace.trim()
      }]);

      setTitulo('');
      setPrecio('');
      setEnlace('');
      cargarMetas();
    } catch (err: any) {
      alert('Error guardando meta: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const toggleEstado = async (id: string, completadoActual: boolean) => {
    await supabase.from('metas').update({ completado: !completadoActual }).eq('id', id);
    cargarMetas();
  };

  const eliminarMeta = async (id: string) => {
    if (!confirm('¿Eliminar este objetivo?')) return;
    await supabase.from('metas').delete().eq('id', id);
    cargarMetas();
  };

  const calcularProgreso = (cat: string) => {
    const items = metas.filter(m => m.categoria === cat);
    if (items.length === 0) return 0;
    const listos = items.filter(m => m.completado).length;
    return Math.round((listos / items.length) * 100);
  };

  const calcularTotalEstimado = (cat: string) => {
    return metas
      .filter(m => m.categoria === cat)
      .reduce((acc, curr) => acc + (Number(curr.precio) || 0), 0);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '14px' }}>
      
      {/* Formulario */}
      <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, transition: 'all 0.3s' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: textTitle }}>
          🎯 Registro de Objetivos y Compras
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Categoría / Proyecto</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value as any)} style={inputStyle}>
              <option value="Solar / Casa" style={{ background: bgCard, color: textPrimary }}>🏡 Solar & Construcción Casa</option>
              <option value="Bebé 2027" style={{ background: bgCard, color: textPrimary }}>👶 Preparativos Bebé (Marzo 2027)</option>
              <option value="General" style={{ background: bgCard, color: textPrimary }}>📌 General</option>
            </select>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Objetivo / Artículo</label>
            <input type="text" required value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej. Play Yard, Coche, Muro perimetral..." style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Precio Estimado (RD$ / USD)</label>
              <input type="number" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0.00" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Link / Enlace de la Tienda</label>
              <input type="url" value={enlace} onChange={e => setEnlace(e.target.value)} placeholder="https://..." style={inputStyle} />
            </div>
          </div>

          <button type="submit" disabled={cargando} style={{ width: '100%', background: '#0284c7', color: '#fff', padding: '11px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '6px' }}>
            {cargando ? 'Guardando...' : 'Agregar Objetivo'}
          </button>
        </form>
      </div>

      {/* Lista de Objetivos */}
      <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, transition: 'all 0.3s' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: textTitle }}>
          📋 Lista de Objetivos Activos
        </div>

        <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Categoría: Solar / Casa */}
          <div style={{ background: bgInput, border: `1px solid ${borderCard}`, borderRadius: '10px', padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
              <span>🏡 Solar & Construcción</span>
              <span>{calcularProgreso('Solar / Casa')}%</span>
            </div>
            <div style={{ fontSize: '10px', color: textLabel, marginBottom: '6px' }}>
              Total Est.: <b>RD$ {calcularTotalEstimado('Solar / Casa').toLocaleString()}</b>
            </div>
            <div style={{ width: '100%', height: '6px', background: borderCard, borderRadius: '3px', marginBottom: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${calcularProgreso('Solar / Casa')}%`, height: '100%', background: '#0284c7', transition: 'width 0.3s' }} />
            </div>

            {metas.filter(m => m.categoria === 'Solar / Casa').map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${borderCard}` }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer', textDecoration: item.completado ? 'line-through' : 'none', color: item.completado ? textLabel : textPrimary }}>
                  <input type="checkbox" checked={item.completado} onChange={() => toggleEstado(item.id!, item.completado)} />
                  {item.titulo}
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {item.precio ? (
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#0284c7' }}>
                      RD$ {Number(item.precio).toLocaleString()}
                    </span>
                  ) : null}

                  {item.enlace ? (
                    <a href={item.enlace} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', display: 'flex', alignItems: 'center' }} title="Ir a la tienda">
                      <ExternalLink size={13} />
                    </a>
                  ) : null}

                  <button onClick={() => eliminarMeta(item.id!)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '10px' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>

          {/* Categoría: Bebé 2027 */}
          <div style={{ background: bgInput, border: `1px solid ${borderCard}`, borderRadius: '10px', padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
              <span>👶 Preparativos Bebé (Marzo 2027)</span>
              <span>{calcularProgreso('Bebé 2027')}%</span>
            </div>
            <div style={{ fontSize: '10px', color: textLabel, marginBottom: '6px' }}>
              Total Est.: <b>RD$ {calcularTotalEstimado('Bebé 2027').toLocaleString()}</b>
            </div>
            <div style={{ width: '100%', height: '6px', background: borderCard, borderRadius: '3px', marginBottom: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${calcularProgreso('Bebé 2027')}%`, height: '100%', background: '#ec4899', transition: 'width 0.3s' }} />
            </div>

            {metas.filter(m => m.categoria === 'Bebé 2027').map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${borderCard}` }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer', textDecoration: item.completado ? 'line-through' : 'none', color: item.completado ? textLabel : textPrimary }}>
                  <input type="checkbox" checked={item.completado} onChange={() => toggleEstado(item.id!, item.completado)} />
                  {item.titulo}
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {item.precio ? (
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#ec4899' }}>
                      RD$ {Number(item.precio).toLocaleString()}
                    </span>
                  ) : null}

                  {item.enlace ? (
                    <a href={item.enlace} target="_blank" rel="noopener noreferrer" style={{ color: '#ec4899', display: 'flex', alignItems: 'center' }} title="Ir a la tienda">
                      <ExternalLink size={13} />
                    </a>
                  ) : null}

                  <button onClick={() => eliminarMeta(item.id!)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '10px' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  );
};

export default Metas;
