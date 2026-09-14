import { supabase } from './supabase';

function generarCodigoInvitacion(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'FAM-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function registrarUsuario(
  email: string,
  pass: string,
  nombreUsuario: string,
  codigoInvitacionExistente?: string
) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: pass,
  });

  if (authError || !authData.user) throw new Error(authError?.message || 'Error al crear usuario');

  let familiaId: string;

  if (codigoInvitacionExistente && codigoInvitacionExistente.trim() !== '') {
    const { data: familiaData, error: famError } = await supabase
      .from('familias')
      .select('id')
      .eq('codigo_invitacion', codigoInvitacionExistente.trim().toUpperCase())
      .single();

    if (famError || !familiaData) {
      throw new Error('El código de invitación familiar no es válido.');
    }
    familiaId = familiaData.id;
  } else {
    const nuevoCodigo = generarCodigoInvitacion();
    const { data: nuevaFamilia, error: newFamError } = await supabase
      .from('familias')
      .insert([{ nombre: `Familia de ${nombreUsuario}`, codigo_invitacion: nuevoCodigo }])
      .select('id')
      .single();

    if (newFamError || !nuevaFamilia) throw new Error('Error al crear el grupo familiar');
    familiaId = nuevaFamilia.id;
  }

  const { error: perfilError } = await supabase
    .from('perfiles')
    .insert([{ id: authData.user.id, email, nombre_usuario: nombreUsuario, familia_id: familiaId }]);

  if (perfilError) throw new Error(perfilError.message);

  return authData;
}

export async function iniciarSesion(email: string, pass: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function cerrarSesion() {
  await supabase.auth.signOut();
}

export async function obtenerPerfilUsuario() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: perfil, error } = await supabase
      .from('perfiles')
      .select('*, familias(nombre, codigo_invitacion)')
      .eq('id', user.id)
      .single();

    if (error) {
      console.warn('Error consultando el perfil:', error.message);
      return null;
    }

    return perfil;
  } catch (err) {
    console.error('Error al verificar sesión:', err);
    return null;
  }
}
