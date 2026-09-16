import { supabase } from './supabase';

function generarCodigoInvitacion(nombreUsuario?: string): string {
  const base = nombreUsuario ? nombreUsuario.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8) : 'FAM';
  const numeroRandom = Math.floor(1000 + Math.random() * 9000);
  return `${base}-${numeroRandom}`;
}

export async function registrarUsuario(
  email: string,
  pass: string,
  nombreUsuario: string,
  codigoInvitacionExistente?: string
) {
  const cleanEmail = email.trim();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: cleanEmail,
    password: pass,
  });

  if (authError || !authData.user) {
    throw new Error(authError?.message || 'Error al crear usuario');
  }

  let familiaId: string | null = null;

  // 1. Si proporcionó un código de invitación, unirse a esa familia
  if (codigoInvitacionExistente && codigoInvitacionExistente.trim() !== '') {
    const { data: familiaData } = await supabase
      .from('familias')
      .select('id')
      .eq('codigo_invitacion', codigoInvitacionExistente.trim().toUpperCase())
      .maybeSingle();

    if (familiaData) {
      familiaId = familiaData.id;
    }
  }

  // 2. Si no viene código o no existe, crear un grupo familiar privado nuevo automáticamente
  if (!familiaId) {
    const nuevoCodigo = generarCodigoInvitacion(nombreUsuario);
    const { data: nuevaFamilia } = await supabase
      .from('familias')
      .insert([{ nombre: `Familia de ${nombreUsuario}`, codigo_invitacion: nuevoCodigo }])
      .select('id')
      .maybeSingle();

    if (nuevaFamilia) {
      familiaId = nuevaFamilia.id;
    }
  }

  // 3. Crear el perfil de usuario asociado a la familia
  await supabase.from('perfiles').upsert([{ 
    id: authData.user.id, 
    email: cleanEmail, 
    nombre_usuario: nombreUsuario, 
    familia_id: familiaId 
  }]);

  return authData;
}

export async function iniciarSesion(email: string, pass: string) {
  const cleanEmail = email.trim();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: pass,
  });

  if (error) throw new Error(error.message);

  if (data.user) {
    const { data: perfilExistente } = await supabase
      .from('perfiles')
      .select('id, familia_id')
      .eq('id', data.user.id)
      .maybeSingle();

    // Si no existe perfil o no tiene grupo asignado, crearle uno propio
    if (!perfilExistente || !perfilExistente.familia_id) {
      const nombreAuto = cleanEmail.split('@')[0];
      const nuevoCodigo = generarCodigoInvitacion(nombreAuto);

      const { data: nuevaFam } = await supabase
        .from('familias')
        .insert([{ nombre: `Familia de ${nombreAuto}`, codigo_invitacion: nuevoCodigo }])
        .select('id')
        .maybeSingle();

      const familiaAsignadaId = nuevaFam ? nuevaFam.id : null;

      await supabase.from('perfiles').upsert([{
        id: data.user.id,
        email: cleanEmail,
        nombre_usuario: nombreAuto,
        familia_id: familiaAsignadaId
      }]);
    }
  }

  return data;
}

export async function cerrarSesion() {
  await supabase.auth.signOut();
}

export async function obtenerPerfilUsuario() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Intentar traer el perfil junto con la familia vinculada
    const { data: perfil, error } = await supabase
      .from('perfiles')
      .select('*, familias(*)')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error al obtener perfil en consulta primaria:', error);
    }

    if (perfil) {
      // Si por alguna razón la relación anidada no trajo los datos de familias pero existe familia_id
      if (perfil.familia_id && !perfil.familias) {
        const { data: fam } = await supabase
          .from('familias')
          .select('id, nombre, codigo_invitacion')
          .eq('id', perfil.familia_id)
          .maybeSingle();
        if (fam) perfil.familias = fam;
      }
      return perfil;
    }

    return {
      id: user.id,
      email: user.email,
      nombre_usuario: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
      familia_id: null
    };

  } catch (err) {
    console.error('Error al verificar sesión:', err);
    return null;
  }
}
