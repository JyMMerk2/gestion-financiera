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
  const cleanEmail = email.trim();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: cleanEmail,
    password: pass,
  });

  if (authError || !authData.user) {
    throw new Error(authError?.message || 'Error al crear usuario');
  }

  let familiaId: string | null = null;

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

  if (!familiaId) {
    const nuevoCodigo = generarCodigoInvitacion();
    const { data: nuevaFamilia } = await supabase
      .from('familias')
      .insert([{ nombre: `Familia de ${nombreUsuario}`, codigo_invitacion: nuevoCodigo }])
      .select('id')
      .maybeSingle();

    if (nuevaFamilia) {
      familiaId = nuevaFamilia.id;
    }
  }

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
      .select('id')
      .eq('id', data.user.id)
      .maybeSingle();

    if (!perfilExistente) {
      const { data: famExistente } = await supabase.from('familias').select('id').limit(1).maybeSingle();
      
      await supabase.from('perfiles').upsert([{
        id: data.user.id,
        email: cleanEmail,
        nombre_usuario: cleanEmail.split('@')[0],
        familia_id: famExistente ? famExistente.id : null
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

    // Consulta simplificada para evitar fallos por join de tablas o RLS
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (perfil) {
      // Intenta obtener información de la familia si existe
      if (perfil.familia_id) {
        const { data: fam } = await supabase
          .from('familias')
          .select('nombre, codigo_invitacion')
          .eq('id', perfil.familia_id)
          .maybeSingle();
        if (fam) perfil.familias = fam;
      }
      return perfil;
    }

    // Perfil por defecto en memoria si aún no está en BD para no bloquear el login
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
