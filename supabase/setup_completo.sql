-- ESQUEMA COMPLETO: pegar y ejecutar UNA vez en Supabase > SQL Editor (proyecto nuevo).

-- Esquema inicial. Solo aditivo: no contiene DROP ni borrados de datos.
create extension if not exists pgcrypto;

create table admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table store_settings (            -- fila única (id = 1)
  id int primary key default 1 check (id = 1),
  store_open boolean not null default true,
  maintenance_message text not null default 'Estamos en mantenimiento. Volvemos pronto.',
  delivery_fee int not null default 6000 check (delivery_fee >= 0),
  pickup_days int[] not null default '{1,2,3,4,5}',
  pickup_windows jsonb not null default '[{"from":"08:00","to":"12:00"},{"from":"14:00","to":"17:00"}]',
  whatsapp text not null default '573106340725',
  design jsonb not null default '{}'::jsonb,   -- banner, textos, colores, secciones visibles
  updated_at timestamptz not null default now()
);
insert into store_settings (id) values (1);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

create table products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique check (sku ~ '^[A-Z0-9-]+$'),
  name text not null,
  short_description text not null default '',
  long_description text not null default '',
  price int not null check (price >= 0),
  promo_price int check (promo_price is null or (promo_price >= 0 and promo_price < price)),
  category_id uuid references categories(id),
  stock int not null default 0 check (stock >= 0),      -- nunca negativo: protege contra sobreventa
  low_stock_threshold int not null default 2,
  sale_unit text not null default 'unidad',
  is_active boolean not null default true,
  availability text not null default 'available' check (availability in ('available','sold_out','coming_soon')),
  featured boolean not null default false,
  featured_order int not null default 0,
  ingredients text, allergens text, weight text, storage text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  storage_path text not null,
  card_path text,                       -- recorte del vaso para tarjetas
  alt text not null default '',
  sort_order int not null default 0,
  is_primary boolean not null default false
);
create unique index one_primary_image on product_images(product_id) where is_primary;

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  kind text not null check (kind in ('entry','exit','adjustment','sale','release')),
  delta int not null,
  stock_after int not null,
  reason text,
  order_id uuid,
  actor uuid,
  created_at timestamptz not null default now()
);

create sequence order_number_seq start 1001;
create table orders (
  id uuid primary key default gen_random_uuid(),
  number int not null unique default nextval('order_number_seq'),
  customer_name text not null, customer_email text not null, customer_phone text not null,
  fulfillment text not null check (fulfillment in ('pickup','delivery')),
  address text, address_notes text, pickup_slot text,
  subtotal int not null, discount int not null default 0, shipping int not null default 0, total int not null,
  payment_status text not null default 'pending' check (payment_status in ('pending','approved','rejected','cancelled','refunded')),
  fulfillment_status text not null default 'new' check (fulfillment_status in ('new','preparing','ready','shipped','delivered','cancelled')),
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fulfillment <> 'delivery' or address is not null)
);

create table order_items (               -- copia histórica: cambios posteriores del producto no la alteran
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id),
  sku text not null, name text not null,
  unit_price int not null, qty int not null check (qty > 0), line_total int not null
);

create table order_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  field text not null, old_value text, new_value text, actor uuid,
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  provider text not null default 'mercadopago',
  provider_payment_id text unique,
  preference_id text, method text, status text, amount int,
  created_at timestamptz not null default now()
);

create table payment_events (            -- idempotencia de webhooks
  event_key text primary key,            -- p.ej. "payment:123:approved"
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

create table audit_log (
  id bigserial primary key,
  actor uuid, action text not null, entity text, entity_id text, detail jsonb,
  created_at timestamptz not null default now()
);

-- RLS: todo cerrado por defecto. El backend usa la service role; el público solo lee catálogo.
alter table admin_users enable row level security;
alter table store_settings enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table inventory_movements enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_history enable row level security;
alter table payments enable row level security;
alter table payment_events enable row level security;
alter table audit_log enable row level security;

create policy "catalogo publico" on products for select using (is_active);
create policy "categorias publicas" on categories for select using (true);
create policy "imagenes publicas" on product_images for select
  using (exists (select 1 from products p where p.id = product_id and p.is_active));
create policy "ajustes publicos" on store_settings for select using (true);

create function is_admin() returns boolean language sql stable security definer as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;
create policy "admin todo products" on products for all using (is_admin()) with check (is_admin());
create policy "admin todo images" on product_images for all using (is_admin()) with check (is_admin());
create policy "admin todo settings" on store_settings for all using (is_admin()) with check (is_admin());
create policy "admin lee pedidos" on orders for select using (is_admin());
create policy "admin lee items" on order_items for select using (is_admin());
create policy "admin lee movimientos" on inventory_movements for select using (is_admin());
create policy "admin lee historial" on order_history for select using (is_admin());
create policy "admin lee auditoria" on audit_log for select using (is_admin());

-- Creación atómica de pedidos: valida tienda abierta, producto activo y stock; congela precios; descuenta inventario.
create or replace function create_order(p_customer jsonb, p_fulfillment text, p_items jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  s store_settings%rowtype; oid uuid; it jsonb; pr products%rowtype;
  qty int; price int; sub int := 0; ship int := 0;
begin
  select * into s from store_settings where id = 1;
  if not s.store_open then raise exception 'STORE_CLOSED'; end if;
  if p_fulfillment not in ('pickup','delivery') then raise exception 'INVALID_FULFILLMENT'; end if;
  if jsonb_array_length(p_items) = 0 then raise exception 'EMPTY_CART'; end if;
  if p_fulfillment = 'delivery' then ship := s.delivery_fee; end if;

  insert into orders (customer_name, customer_email, customer_phone, fulfillment, address, address_notes, pickup_slot, subtotal, shipping, total)
  values (p_customer->>'name', p_customer->>'email', p_customer->>'phone', p_fulfillment,
          p_customer->>'address', p_customer->>'address_notes', p_customer->>'pickup_slot', 0, ship, 0)
  returning id into oid;

  -- orden por SKU para evitar interbloqueos entre pedidos simultáneos
  for it in select value from jsonb_array_elements(p_items) order by value->>'sku' loop
    qty := (it->>'qty')::int;
    if qty < 1 then raise exception 'INVALID_QTY'; end if;
    select * into pr from products where sku = it->>'sku' for update;
    if not found or not pr.is_active or pr.availability <> 'available' then raise exception 'PRODUCT_UNAVAILABLE:%', it->>'sku'; end if;
    if pr.stock < qty then raise exception 'INSUFFICIENT_STOCK:%', pr.sku; end if;
    price := coalesce(pr.promo_price, pr.price);
    update products set stock = stock - qty, updated_at = now() where id = pr.id;
    insert into inventory_movements (product_id, kind, delta, stock_after, reason, order_id)
      values (pr.id, 'sale', -qty, pr.stock - qty, 'Pedido', oid);
    insert into order_items (order_id, product_id, sku, name, unit_price, qty, line_total)
      values (oid, pr.id, pr.sku, pr.name, price, qty, price * qty);
    sub := sub + price * qty;
  end loop;

  update orders set subtotal = sub, total = sub + ship where id = oid;
  return oid;
end $$;

revoke all on function create_order(jsonb, text, jsonb) from public, anon, authenticated;
grant execute on function create_order(jsonb, text, jsonb) to service_role;

-- Datos iniciales de DESARROLLO. Los precios son PROVISIONALES (0): defínelos en /admin antes de vender.
insert into categories (name, sort_order) values ('Parfit', 1) on conflict do nothing;
insert into products (sku, name, short_description, price, stock, category_id, featured, featured_order, is_active, availability)
select v.sku, v.name, v.descr, 0, 5, (select id from categories where name='Parfit'), true, v.ord, false, 'available'
from (values
 ('LCP001','Boondía','Yogurt griego con arándanos, granola y arequipe sin azúcar.',1),
 ('LCP002','Frutos Rojos','Yogurt griego con granola, salsa de fresa, arándanos y arequipe sin azúcar.',2),
 ('LCP003','Maracú','Yogurt griego con pulpa de maracuyá, piña calada y arequipe sin azúcar.',3),
 ('LCP004','Primavera','Yogurt griego con arándanos, salsa de mora y arequipe sin azúcar.',4),
 ('LCP005','Tropical','Yogurt griego con granola, mango, banano y arequipe sin azúcar.',5)
) as v(sku,name,descr,ord)
on conflict (sku) do nothing;
-- is_active = false hasta que definas el precio real; actívalos desde /admin.
