-- CAPTTURE — remove sneakers (we don't sell sneakers) and update hero copy

delete from public.products where category_id = '30000000-0000-0000-0000-000000000017';

delete from public.categories where id = '30000000-0000-0000-0000-000000000017';

update public.hero_content
set subtitle = 'Shop South African designers and tailors. Direct from the maker to your door.'
where id = 'ecaf1ad3-c43c-4987-b63e-afc5f299f6f3';
