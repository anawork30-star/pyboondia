# Conectar tu dominio de GoDaddy a Vercel
Los valores exactos de DNS los muestra Vercel al añadir el dominio; confírmalos ahí antes de copiar.
1. Vercel > Project > Settings > Domains > Add: escribe tu dominio.
2. Vercel te indicará un registro A para el dominio raíz (@) y un CNAME para `www`.
3. GoDaddy > Mis productos > tu dominio > DNS > Administrar. Edita **solo** el registro A de `@` y el CNAME de `www`.
4. **No toques** los registros MX, TXT (SPF/DKIM) ni otros si usas correo con ese dominio.
5. Espera la propagación (minutos a horas). Vercel emite el certificado HTTPS automáticamente.
6. Define `NEXT_PUBLIC_SITE_URL=https://tudominio.com` en Vercel y usa esa URL para las URLs de retorno de Mercado Pago.
7. Verifica: `https://tudominio.com` (tienda) y `https://tudominio.com/admin` (login).
