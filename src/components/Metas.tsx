import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useModoOscuro } from '../hooks/useModoOscuro';
import { ExternalLink, CheckSquare, Square, Trash2, Plus } from 'lucide-react';

interface MetasProps {
  familiaId: string;
  perfil?: any;
}

interface ItemMeta {
  id?: string;
  familia_id: string;
  categoria: string;
  titulo: string;
  completado: boolean;
  precio?: number;
  enlace?: string;
  moneda_item?: 'RD$' | 'USD' | 'EUR';
}

export const Metas: React.FC<MetasProps> = ({ familiaId, perfil }) => {
  const { bgCard, borderCard, textPrimary, textLabel, inputStyle, textTitle, bgInput } = useModoOscuro();

  const [titulo, setTitulo] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [categoria, setCategoria] = useState<string>('General');
  const [precio, setPrecio] = useState('');
  const [monedaItem, setMonedaItem] = useState<'RD$' | 'USD' | 'EUR'>('USD');
  const [enlace, setEnlace] = useState('');

  const [metas, setMetas] = useState<ItemMeta[]>([]);
  const [cargando, setCargando] = useState(false);

  const tasaUsd = perfil?.familias?.tasa_usd || 60.00;
  const tasaEur = perfil?.familias?.tasa_eur || 65.00;

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

  // Extraer categorías únicas creadas por el usuario
  const categoriasDisponibles = Array.from(new Set(metas.map(m => m.categoria)));

  const formatearUrl = (url: string) => {
    if (!url) return '';
    const cleanUrl = url.trim();
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) return cleanUrl;
    return `https://${cleanUrl}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !familiaId) return;

    const categoriaFinal = nuevaCategoria.trim() ? nuevaCategoria.trim() : categoria;

    setCargando(true);
    try {
      const payload = {
        familia_id: familiaId,
        categoria: categoriaFinal,
        titulo: titulo.trim(),
        completado: false,
        precio: precio ? Number(precio) : 0,
        enlace: enlace.trim() ? formatearUrl(enlace) : '',
        moneda_item: monedaItem
      };

      const { error } = await supabase.from('metas').insert([payload]);

      if (error) {
        alert('Error: ' + error.message);
      } else {
        setTitulo('');
        setPrecio('');
        setEnlace('');
        setNuevaCategoria('');
        setCategoria(categoriaFinal);
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

  const calcularTotalRD = (cat: string) => {
    return metas
      .filter(m => m.categoria === cat)
      .reduce((acc, curr) => {
        const monto = Number(curr.precio) || 0;
        const divisa = curr.moneda_item || 'RD$';
        let pesos = monto;
        if (divisa === 'USD') pesos = monto * tasaUsd;
        if (divisa === 'EUR') pesos = monto * tasaEur;
        return acc + pesos;
      }, 0);
  };

  const calcularProgreso = (cat: string) => {
    const items = metas.filter(m => m.categoria === cat);
    if (items.length === 0) return 0;
    const completados = items.filter(m => m.completado).length;
    return Math.round((completados / items.length) * 100);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '14px' }}>
      
      {/* Formulario */}
      <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary }}>
        <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: textTitle }}>
          🎯 Crear Nuevo Objetivo / Compra
        </div>

        <form onSubmit={handleSubmit}>
          {/* Selección o Creación de Categoría */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Proyecto / Categoría</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <select value={categoria} onChange={e => setCategoria(e.target.value)} style={inputStyle}>
                {categoriasDisponibles.length === 0 && <option value="General">General</option>}
                {categoriasDisponibles.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <input
                type="text"
                value={nuevaCategoria}
                onChange={e => setNuevaCategoria(e.target.value)}
                placeholder="+ Crear Nueva..."
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Objetivo / Artículo</label>
            <input type="text" required value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej. Play Yard, Cortar árboles..." style={inputStyle} />
          </div>

          {/* Precio y Selector de Moneda */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Precio Estimado</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input type="number" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0.00" style={{ ...inputStyle, flex: 1 }} />
                <select value={monedaItem} onChange={e => setMonedaItem(e.target.value as any)} style={{ ...inputStyle, width: '65px', padding: '0 4px', fontWeight: 'bold' }}>
                  <option value="USD">USD$</option>
                  <option value="RD$">RD$</option>
                  <option value="EUR">EUR€</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Link de la Tienda</label>
              <input type="text" value={enlace} onChange={e => setEnlace(e.target.value)} placeholder="https://..." style={inputStyle} />
            </div>
          </div>

          <button type="submit" disabled={cargando} style={{ width: '100%', background: '#0284c7', color: '#fff', padding: '11px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '6px' }}>
            {cargando ? 'Guardando...' : 'Agregar Objetivo'}
          </button>
        </form>
      </div>

      {/* Lista Dinámica por Categorías Creadas */}
      <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: textTitle }}>
            📋 Lista de Objetivos Activos
          </span>
          <span style={{ fontSize: '10px', color: textLabel }}>
            Tasa actual: <b>1 USD = RD$ {tasaUsd}</b>
          </span>
        </div>

        <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {categoriasDisponibles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: textLabel, fontSize: '12px' }}>
              No tienes objetivos registrados. ¡Agrega tu primer objetivo a la izquierda!
            </div>
          ) : (
            categoriasDisponibles.map(cat => (
              <div key={cat} style={{ background: bgInput, border: `1px solid ${borderCard}`, borderRadius: '10px', padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                  <span>📌 {cat}</span>
                  <span>{calcularProgreso(cat)}%</span>
                </div>
                <div style={{ fontSize: '10px', color: textLabel, marginBottom: '6px' }}>
                  Total Est. (Convertido): <b style={{ color: '#0284c7' }}>RD$ {Math.round(calcularTotalRD(cat)).toLocaleString()}</b>
                </div>
                <div style={{ width: '100%', height: '6px', background: borderCard, borderRadius: '3px', marginBottom: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${calcularProgreso(cat)}%`, height: '100%', background: '#0284c7', transition: 'width 0.3s' }} />
                </div>

                {metas.filter(m => m.categoria === cat).map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${borderCard}` }}>
                    <div onClick={() => toggleEstado(item.id!, item.completado)} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer', textDecoration: item.completado ? 'line-through' : 'none', color: item.completado ? textLabel : textPrimary }}>
                      {item.completado ? <CheckSquare size={16} color="#10b981" /> : <Square size={16} color={textLabel} />}
                      <span>{item.titulo}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {item.precio ? (
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#0284c7' }}>
                          {item.moneda_item || 'USD'} {Number(item.precio).toLocaleString()}
                        </span>
                      ) : null}

                      {item.enlace ? (
                        <a href={formatearUrl(item.enlace)} target="_blank" rel="noreferrer noopener" style={{ color: '#38bdf8', display: 'flex', alignItems: 'center' }}>
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
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default Metas;
