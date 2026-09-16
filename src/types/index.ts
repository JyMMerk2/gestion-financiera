export interface Familia {
  id: string;
  nombre: string;
  codigo_invitacion: string;
  created_at?: string;
}

export interface PerfilUsuario {
  id: string;
  email: string;
  nombre_usuario: string;
  familia_id: string;
  familias?: Familia;
}

export type TipoTransaccion = 'Ingreso' | 'Gasto';

export interface TransaccionPresupuesto {
  id?: string;
  familia_id?: string;
  usuario_id?: string;
  fecha: string;
  tipo: TipoTransaccion;
  categoria: string;
  concepto: string;
  monto_dop: number;
  monto_original: number;
  moneda: 'DOP' | 'USD' | 'EUR';
  tasa_cambio: number;
  wallet: string;
  created_at?: string;
}

export interface FondoAhorro {
  id?: string;
  familia_id?: string;
  fecha: string;
  meta: string;
  concepto: string;
  monto_dop: number;
  monto_original: number;
  moneda: 'DOP' | 'USD' | 'EUR';
  tasa_cambio?: number;
  tipo: 'Depósito' | 'Retiro';
  wallet_origen: string;
  wallet_destino: string;
  created_at?: string;
}

export interface RegistroPatrimonio {
  id?: string;
  familia_id?: string;
  fecha: string;
  nombre: string;
  valor_dop: number;
  foto_url?: string;
  created_at?: string;
}

export interface RegistroPrestamo {
  id?: string;
  familia_id?: string;
  fecha: string;
  entidad: string;
  tipo: 'Pago Cuota' | 'Nueva Deuda';
  monto: number;
  monto_total?: number;
  wallet: string;
  notas?: string;
  created_at?: string;
}

export interface MetaObjetivo {
  id?: string;
  familia_id: string;
  categoria: 'Solar / Casa' | 'Bebé 2027' | 'General';
  titulo: string;
  completado: boolean;
  monto_estimado?: number;
  monto_actual?: number;
}

export interface ElementoConfig {
  id?: string;
  familia_id?: string;
  tipo: 'Wallet' | 'Ahorro' | 'Categoria' | 'Vehiculo';
  nombre: string;
  estado: 'Activo' | 'Oculto';
  created_at?: string;
}
