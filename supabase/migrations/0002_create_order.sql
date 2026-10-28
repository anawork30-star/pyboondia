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
