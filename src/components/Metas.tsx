import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { consultarTablaCompartida, insertarRegistroCompartido } from '../services/familiaService';
import { useModoOscuro } from '../hooks/useModoOscuro';
import { ExternalLink, CheckSquare, Square, Trash2, Search, Edit2, X, Target } from 'lucide-react';

interface MetasProps {
  familiaId?: string;
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

export const Metas: React.FC<MetasProps> = ({ perfil }) => {
  const { bgCard, borderCard, textPrimary, textLabel, inputStyle, textTitle, bgInput, esOscuro } = useModoOscuro();

  const [titulo, setTitulo] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [categoria, setCategoria] = useState<string>('General');
  const [precio, setPrecio] = useState('');
  const [monedaItem, setMonedaItem] = useState<'RD$' | 'USD' | 'EUR'>('USD');
  const [enlace, setEnlace] = useState('');

  // Estado para Edición
  const [idEditando, setIdEditando] = useState<string | null>(null);

  // Estado para Buscador Interactivo
  const [busqueda, setBusqueda] = useState('');

  const [metas, setMetas] = useState<ItemMeta[]>([]);
  const [cargando, setCargando] = useState(false);

  const tasaUsd = perfil?.familias?.tasa_usd || 60.00;
  const tasaEur = perfil?.familias?.tasa_eur || 65.00;

  // Carga compartida desde familiaService.ts
  const cargarMetas = useCallback(async () => {
    const { data } = await consultarTablaCompartida('metas', 'created_at');
    if (data) setMetas(data);
  }, []);

  useEffect(() => {
    cargarMetas();
  }, [cargarMetas]);

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
    if (!titulo.trim()) return;

    const categoriaFinal = nuevaCategoria.trim() ? nuevaCategoria.trim() : categoria;

    setCargando(true);
    try {
      const payload = {
        categoria: categoriaFinal,
        titulo: titulo.trim(),
        completado: false,
        precio: precio ? Number(precio) : 0,
        enlace: enlace.trim() ? formatearUrl(enlace) : '',
        moneda_item: monedaItem
      };

      if (idEditando) {
        const { error } = await supabase.from('metas').update(payload).eq('id', idEditando);
        if (error) throw error;
        alert('¡Objetivo actualizado!');
        setIdEditando(null);
      } else {
        await insertarRegistroCompartido('metas', payload);
        alert('¡Objetivo registrado!');
      }

      setTitulo('');
      setPrecio('');
      setEnlace('');
      setNuevaCategoria('');
      setCategoria(categoriaFinal);
      await cargarMetas();
    } catch (err: any) {
      alert('Error de Supabase: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const iniciarEdicion = (item: ItemMeta) => {
    setIdEditando(item.id || null);
    setTitulo(item.titulo || '');
    setCategoria(item.categoria || 'General');
    setPrecio(String(item.precio || ''));
    setMonedaItem(item.moneda_item || 'USD');
    setEnlace(item.enlace || '');
  };

  const cancelarEdicion = () => {
    setIdEditando(null);
    setTitulo('');
    setPrecio('');
    setEnlace('');
    setNuevaCategoria('');
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

  const calcularTotalRD = (metasCat: ItemMeta[]) => {
    return metasCat.reduce((acc, curr) => {
      const monto = Number(curr.precio) || 0;
      const divisa = curr.moneda_item || 'RD$';
      let pesos = monto;
      if (divisa === 'USD') pesos = monto * tasaUsd;
      if (divisa === 'EUR') pesos = monto * tasaEur;
      return acc + pesos;
    }, 0);
  };

  const calcularProgreso = (metasCat: ItemMeta[]) => {
    if (metasCat.length === 0) return 0;
    const completados = metasCat.filter(m => m.completado).length;
    return Math.round((completados / metasCat.length) * 100);
  };

  // Sugerencias autocompletables para el buscador
  const sugerenciasBusqueda = Array.from(
    new Set([
      ...metas.map(m => m.titulo).filter(Boolean),
      ...metas.map(m => m.categoria).filter(Boolean)
    ])
  );

  // Filtrado dinámico por lo escrito en el buscador
  const metasFiltradas = metas.filter(m => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return m.titulo.toLowerCase().includes(q) || m.categoria.toLowerCase().includes(q);
  });

  // Categorías resultantes del filtro
  const categoriasFiltradas = Array.from(new Set(metasFiltradas.map(m => m.categoria)));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
      
      {/* Formulario */}
      <div style={{ background: bgCard, border: `1px solid ${idEditando ? '#ffea00' : borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, transition: 'all 0.3s' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px', color: idEditando ? '#ffea00' : textTitle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={14} color={idEditando ? '#ffea00' : '#00e5ff'} />
            {idEditando ? '✏️ Editando Objetivo' : '🎯 Crear Nuevo Objetivo / Compra'}
          </span>
          {idEditando && (
            <button onClick={cancelarEdicion} style={{ background: 'transparent', border: 'none', color: '#ff007f', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px', fontWeight: 'bold' }}>
              <X size={12} /> Cancelar
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Selección o Creación de Categoría */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Proyecto / Categoría</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '6px' }}>
              <select value={categoria} onChange={e => setCategoria(e.target.value)} style={inputStyle}>
                {categoriasDisponibles.length === 0 && <option value="General">General</option>}
                {categoriasDisponibles.map(cat => (
                  <option key={cat} value={cat} style={{ background: bgCard, color: textPrimary }}>{cat}</option>
                ))}
              </select>

              <input
                type="text"
                value={nuevaCategoria}
                onChange={e => setNuevaCategoria(e.target.value)}
                placeholder="+ Nueva Categ..."
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Objetivo / Artículo</label>
            <input type="text" required value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej. Play Yard, Cortar árboles..." style={inputStyle} />
          </div>

          {/* Precio y Selector de Moneda */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Precio Estimado</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input type="number" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0.00" style={{ ...inputStyle, flex: 1 }} />
                <select value={monedaItem} onChange={e => setMonedaItem(e.target.value as any)} style={{ ...inputStyle, width: '65px', padding: '0 4px', fontWeight: 'bold' }}>
                  <option value="USD" style={{ background: bgCard, color: textPrimary }}>USD$</option>
                  <option value="RD$" style={{ background: bgCard, color: textPrimary }}>RD$</option>
                  <option value="EUR" style={{ background: bgCard, color: textPrimary }}>EUR€</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: textLabel, marginBottom: '3px' }}>Link de la Tienda</label>
              <input type="text" value={enlace} onChange={e => setEnlace(e.target.value)} placeholder="https://..." style={inputStyle} />
            </div>
          </div>

          <button type="submit" disabled={cargando} style={{ width: '100%', background: idEditando ? '#ffea00' : (esOscuro ? '#00e5ff' : '#0284c7'), color: idEditando || esOscuro ? '#0a0e14' : '#fff', padding: '11px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '6px' }}>
            {cargando ? 'Guardando...' : (idEditando ? 'Actualizar Objetivo' : 'Agregar Objetivo')}
          </button>
        </form>
      </div>

      {/* Lista Dinámica por Categorías Creadas */}
      <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '14px', padding: '16px', color: textPrimary, transition: 'all 0.3s' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: `1px solid ${borderCard}`, paddingBottom: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: textTitle }}>
            📋 Lista de Objetivos Activos
          </span>
          <span style={{ fontSize: '10px', color: textLabel }}>
            Tasa actual: <b>1 USD = RD$ {tasaUsd}</b>
          </span>
        </div>

        {/* Buscador Interactivo con Datalist */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: bgInput, border: `1px solid ${borderCard}`, borderRadius: '8px', padding: '6px 10px', gap: '8px' }}>
            <Search size={14} color={textLabel} />
            <input
              type="text"
              list="sugerencias-metas"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar objetivo o categoría..."
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: textPrimary,
                fontSize: '11px',
                outline: 'none'
              }}
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} style={{ background: 'none', border: 'none', color: textLabel, cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>
                ✕
              </button>
            )}
          </div>

          <datalist id="sugerencias-metas">
            {sugerenciasBusqueda.map((sug, i) => (
              <option key={i} value={sug} />
            ))}
          </datalist>
        </div>

        <div style={{ maxHeight: '480px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {categoriasFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: textLabel, fontSize: '12px' }}>
              {busqueda ? `Sin resultados para "${busqueda}"` : 'No tienes objetivos registrados.'}
            </div>
          ) : (
            categoriasFiltradas.map(cat => {
              const metasDeCat = metasFiltradas.filter(m => m.categoria === cat);
              const progresoCat = calcularProgreso(metasDeCat);
              const totalEstRD = calcularTotalRD(metasDeCat);

              return (
                <div key={cat} style={{ background: bgInput, border: `1px solid ${borderCard}`, borderRadius: '10px', padding: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                    <span>📌 {cat}</span>
                    <span style={{ color: '#00e5ff' }}>{progresoCat}%</span>
                  </div>
                  <div style={{ fontSize: '10px', color: textLabel, marginBottom: '6px' }}>
                    Total Est. (Convertido): <b style={{ color: '#00e5ff' }}>RD$ {Math.round(totalEstRD).toLocaleString()}</b>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: borderCard, borderRadius: '3px', marginBottom: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${progresoCat}%`, height: '100%', background: '#00e5ff', transition: 'width 0.3s' }} />
                  </div>

                  {metasDeCat.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${borderCard}`, background: idEditando === item.id ? 'rgba(255, 234, 0, 0.1)' : 'transparent' }}>
                      <div onClick={() => toggleEstado(item.id!, item.completado)} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer', textDecoration: item.completado ? 'line-through' : 'none', color: item.completado ? textLabel : textPrimary }}>
                        {item.completado ? <CheckSquare size={16} color="#00ff41" /> : <Square size={16} color={textLabel} />}
                        <span>{item.titulo}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.precio ? (
                          <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#00e5ff' }}>
                            {item.moneda_item || 'USD'} {Number(item.precio).toLocaleString()}
                          </span>
                        ) : null}

                        {item.enlace ? (
                          <a href={formatearUrl(item.enlace)} target="_blank" rel="noreferrer noopener" style={{ color: '#00e5ff', display: 'flex', alignItems: 'center' }}>
                            <ExternalLink size={13} />
                          </a>
                        ) : null}

                        <button onClick={() => iniciarEdicion(item)} title="Editar objetivo" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ffea00' }}>
                          <Edit2 size={13} />
                        </button>

                        <button onClick={() => eliminarMeta(item.id!)} title="Eliminar objetivo" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ff007f' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};

export default Metas;
