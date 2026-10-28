// Valores de negocio iniciales. Los editables viven en la tabla store_settings (panel /admin).
export const BUSINESS = {
  currency: 'COP',
  deliveryFee: 6000,
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '573106340725',
  // 0 = domingo ... 6 = sábado. Horas en formato 24h, zona America/Bogota.
  pickup: {
    timezone: 'America/Bogota',
    days: [1, 2, 3, 4, 5],
    windows: [
      { from: '08:00', to: '12:00' },
      { from: '14:00', to: '17:00' },
    ],
  },
} as const;
