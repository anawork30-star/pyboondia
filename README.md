# Tienda online (Parfit) con panel administrativo

Next.js + Supabase (Postgres, Auth, Storage) + Mercado Pago, desplegada en Vercel.

## Estado del proyecto
| Fase | Estado |
|---|---|
| 1. Arquitectura | Hecha |
| 2. Estructura, esquema SQL, CI, docs | **Hecha (esta entrega)** |
| 3. Panel admin | Pendiente |
| 4. Tienda pública | Pendiente |
| 5. Pagos y reportes | Pendiente |
| 6. Pruebas y publicación | Pendiente |

Nada está publicado, el dominio no está conectado y los pagos no están integrados todavía.

## Reglas de negocio configuradas
- SKU: LCP001 a LCP005, 5 unidades iniciales cada uno.
- Recogida en tienda: lunes a viernes, 8:00-12:00 y 14:00-17:00 (hora de Bogotá).
- Domicilio: costo adicional de $6.000 COP.
- WhatsApp: +57 310 634 0725.
- Precios: **pendientes de definir** (los productos se crean inactivos con precio 0).

## Instalación local
```bash
git clone https://github.com/anawork30-star/<nombre-del-repo>.git
cd <nombre-del-repo>
npm install
cp .env.example .env.local    # completa tus valores
npm run test
npm run dev
```

## Base de datos
Ejecuta en orden `supabase/migrations/0001_schema.sql`, `0002_create_order.sql` y luego `supabase/seed.sql` en el SQL Editor de tu proyecto Supabase (usa proyectos separados para desarrollo y producción). Las migraciones son solo aditivas.

## Ramas y despliegue
`main` = producción estable. `develop` = pruebas. Todo cambio entra por pull request; el CI debe pasar antes de fusionar. Para volver atrás: en Vercel > Deployments, "Promote" una versión anterior; en GitHub, `git revert` del commit.

## Documentación
Ver `docs/` (dominio, pagos, administración).
