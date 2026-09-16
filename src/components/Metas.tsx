import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useModoOscuro } from '../hooks/useModoOscuro';
import { ExternalLink, CheckSquare, Square, Trash2 } from 'lucide-react';

interface MetasProps {
  familiaId: string;
}

interface ItemMeta {
  id?: string;
  familia_id: string;
  categoria: string;
  titulo: string;
  completado: boolean;
  precio?: number;
  enlace?: string;
}

export const Metas: React.FC<MetasProps> = ({ familiaId }) => {
  const { bgCard, borderCard, textPrimary, textLabel, inputStyle, textTitle, bgInput } = useModoOscuro();

  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<string>('Solar / Casa');
  const [precio, setPrecio] = useState('');
  const [enlace, setEnlace] = useState('');

  const [metas, setMetas] = useState<ItemMeta[]>([]);
  const [cargando, setCargando] = useState(false);

  const cargarMetas = async () => {
    if (!familiaId) return;

    // Filtra las metas asociadas a esta familia o de caracter 'general'
    const { data, error } = await supabase
      .from('metas')
      .select('*')
      .or(`familia_id.eq.${familiaId},familia_id.eq.general`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error al cargar metas:', error);
    } else if (data) {
      setMetas(data);
    }
  };

  useEffect(() => {
    cargarMetas();
  }, [familiaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    setCargando(true);
    try {
      // Usa familiaId real recibido de la sesión/perfil
      const targetFamiliaId = familiaId && familiaId.trim() !== '' ? familiaId : 'general';

      const payload = {
        familia_id: targetFamiliaId,
        categoria,
        titulo: titulo.trim(),
        completado: false,
        precio: precio ? Number(precio) : 0,
        enlace: enlace.trim()
      };

      const { error } = await supabase.from('metas').insert([payload]);

      if (error) {
        alert('Error de Supabase: ' + error.message);
      } else {
        setTitulo('');
        setPrecio('');
        setEnlace('');
        await cargarMetas();
      }
    } catch (err: any) {
      alert('Error inesperado: ' + err.message);
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

  const esCategoriaCasa = (cat: string) => cat.includes('Solar') || cat.includes('Casa');
  const esCategoriaBebe = (cat: string) => cat.includes('Bebé') || cat.includes('2027');

  const calcularProgreso = (filtroFn: (cat: string) => boolean) => {
    const items = metas.filter(m => filtroFn(m.categoria));
    if (items.length === 0) return 0;
    const listos = items.filter(m => m.completado).length;
    return Math.round((listos / items.length) * 100);
  };

  const calcularTotalEstimado = (filtroFn: (cat: string) => boolean) => {
    return metas
      .filter(m => filtroFn(m.categoria))
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
            <select value={categoria} onChange={e => setCategoria(e.target.value)} style={inputStyle}>
              <option value="Solar / Casa" style={{ background: bgCard, color: textPrimary }}>Solar & Construcción Casa</option>
              <option value="Bebé 2027" style={{ background: bgCard, color: textPrimary }}>Preparativos Bebé (Marzo 2027)</option>
              <option value="General" style={{ background: bgCard, color: textPrimary }}>General</option>
            </select>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Objetivo / Artículo</label>
            <input type="text" required value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej. Play Yard, Cortar árboles, Cuna..." style={inputStyle} />
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

      {/* Lista de Objetivos Activos */}
      <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, transition: 'all 0.3s' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: textTitle }}>
          📋 Lista de Objetivos Activos
        </div>

        <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Categoría: Solar / Casa */}
          <div style={{ background: bgInput, border: `1px solid ${borderCard}`, borderRadius: '10px', padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
              <span>🏡 Solar & Construcción</span>
              <span>{calcularProgreso(esCategoriaCasa)}%</span>
            </div>
            <div style={{ fontSize: '10px', color: textLabel, marginBottom: '6px' }}>
              Total Est.: <b>RD$ {calcularTotalEstimado(esCategoriaCasa).toLocaleString()}</b>
            </div>
            <div style={{ width: '100%', height: '6px', background: borderCard, borderRadius: '3px', marginBottom: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${calcularProgreso(esCategoriaCasa)}%`, height: '100%', background: '#0284c7', transition: 'width 0.3s' }} />
            </div>

            {metas.filter(m => esCategoriaCasa(m.categoria)).map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${borderCard}` }}>
                <div 
                  onClick={() => toggleEstado(item.id!, item.completado)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer', textDecoration: item.completado ? 'line-through' : 'none', color: item.completado ? textLabel : textPrimary }}
                >
                  {item.completado ? <CheckSquare size={16} color="#10b981" /> : <Square size={16} color={textLabel} />}
                  <span>{item.titulo}</span>
                </div>

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

                  <button onClick={() => eliminarMeta(item.id!)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Categoría: Bebé 2027 */}
          <div style={{ background: bgInput, border: `1px solid ${borderCard}`, borderRadius: '10px', padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
              <span>👶 Preparativos Bebé (Marzo 2027)</span>
              <span>{calcularProgreso(esCategoriaBebe)}%</span>
            </div>
            <div style={{ fontSize: '10px', color: textLabel, marginBottom: '6px' }}>
              Total Est.: <b>RD$ {calcularTotalEstimado(esCategoriaBebe).toLocaleString()}</b>
            </div>
            <div style={{ width: '100%', height: '6px', background: borderCard, borderRadius: '3px', marginBottom: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${calcularProgreso(esCategoriaBebe)}%`, height: '100%', background: '#ec4899', transition: 'width 0.3s' }} />
            </div>

            {metas.filter(m => esCategoriaBebe(m.categoria)).map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${borderCard}` }}>
                <div 
                  onClick={() => toggleEstado(item.id!, item.completado)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer', textDecoration: item.completado ? 'line-through' : 'none', color: item.completado ? textLabel : textPrimary }}
                >
                  {item.completado ? <CheckSquare size={16} color="#10b981" /> : <Square size={16} color={textLabel} />}
                  <span>{item.titulo}</span>
                </div>

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

                  <button onClick={() => eliminarMeta(item.id!)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                    <Trash2 size={13} />
                  </button>
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
