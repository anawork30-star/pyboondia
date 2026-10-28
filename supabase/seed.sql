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
