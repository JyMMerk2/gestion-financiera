import { supabase } from './supabase';

/**
 * Obtiene el ID de la familia activa del usuario actualmente conectado.
 */
export const obtenerFamiliaIdActiva = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: perfil, error } = await supabase
      .from('perfiles')
      .select('familia_id')
      .eq('id', user.id)
      .single();

    if (error || !perfil?.familia_id) return null;
    return perfil.familia_id;
  } catch (err) {
    console.error('Error al obtener familia_id activa:', err);
    return null;
  }
};

/**
 * Realiza una consulta (SELECT) a cualquier tabla compartida filtrando por la familia del usuario.
 */
export const consultarTablaCompartida = async (nombreTabla: string, ordenColumna: string = 'created_at') => {
  const familiaId = await obtenerFamiliaIdActiva();
  if (!familiaId) return { data: [], error: new Error('Usuario sin grupo familiar activo.') };

  return await supabase
    .from(nombreTabla)
    .select('*')
    .eq('familia_id', familiaId)
    .order(ordenColumna, { ascending: true });
};

/**
 * Inserta un registro en cualquier tabla compartida asociándole el familia_id automáticamente.
 */
export const insertarRegistroCompartido = async (nombreTabla: string, datos: any) => {
  const familiaId = await obtenerFamiliaIdActiva();
  if (!familiaId) throw new Error('No perteneces a ningún grupo familiar para guardar este registro.');

  return await supabase
    .from(nombreTabla)
    .insert([{ ...datos, familia_id: familiaId }]);
};
