-- Asocia tus 5 imágenes originales (carpeta /public/seed del repositorio) a sus productos. Seguro de ejecutar más de una vez.
insert into product_images (product_id, storage_path, card_path, alt, sort_order, is_primary)
select p.id, '/seed/originals/' || v.f || '.jpeg', '/seed/cards/' || v.f || '.jpg', p.name, 0, true
from (values ('LCP001','boondia'),('LCP002','frutosrojos'),('LCP003','maracu'),('LCP004','primavera'),('LCP005','tropical')) as v(sku, f)
join products p on p.sku = v.sku
where not exists (select 1 from product_images i where i.product_id = p.id);
