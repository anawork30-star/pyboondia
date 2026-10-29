-- Amplía los servicios aceptados por el formulario: estrategia y creadores UGC.
-- "branding" se mantiene (ahora es un servicio adicional con aliados).
-- No borra datos: solo reemplaza la regla de validación de la columna `service` por una más amplia.
-- Se puede ejecutar más de una vez.

alter table public.contact_requests drop constraint if exists contact_requests_service_check;

alter table public.contact_requests
  add constraint contact_requests_service_check
  check (service in ('estrategia', 'social', 'ugc', 'web', 'ai', 'branding', 'integral'));
