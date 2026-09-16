export interface TasasCambio {
  usd: number;
  eur: number;
  ultimaActualizacion: string;
}

export async function obtenerTasasEnVivo(): Promise<TasasCambio> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();

    if (data && data.rates && data.rates.DOP) {
      const usdToDop = data.rates.DOP;
      const eurToUsd = data.rates.EUR;
      const eurToDop = usdToDop / eurToUsd; // Tasa EUR a DOP

      return {
        usd: Number(usdToDop.toFixed(2)),
        eur: Number(eurToDop.toFixed(2)),
        ultimaActualizacion: new Date().toLocaleDateString('es-DO', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    }
  } catch (err) {
    console.error('Error al obtener tasas en tiempo real:', err);
  }

  // Valores de respaldo por defecto si no hay conexión a internet
  return {
    usd: 60.0,
    eur: 65.0,
    ultimaActualizacion: 'Modo Offline'
  };
}
