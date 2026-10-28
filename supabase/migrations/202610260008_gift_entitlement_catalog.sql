-- Allow existing gift entitlements to cover the current catalogue.
-- Preserve ownership, RLS, trial restrictions and all payment records.
begin;
alter table public.doll_entitlements drop constraint doll_entitlements_product_id_check;
alter table public.doll_entitlements add constraint doll_entitlements_product_id_check
 check(product_id in ('flower-peony', 'flower-lavender', 'bg-starry', 'bg-cafe', 'flower-carnation', 'flower-gerbera', 'flower-orchid', 'flower-lotus', 'flower-sakura', 'flower-chrysanthemum', 'flower-cosmos', 'flower-poppy', 'flower-iris', 'flower-magnolia', 'flower-gardenia', 'flower-jasmine', 'flower-camellia', 'flower-orange-blossom', 'flower-bluebell', 'flower-delphinium', 'flower-statice', 'flower-lilac', 'flower-daffodil', 'flower-anemone', 'animal-panda', 'animal-red-panda', 'animal-monkey', 'bg-glasshouse', 'bg-sunset-picnic', 'bg-cozy-room', 'bg-sakura-lantern', 'bg-starlight-rooftop'));
commit;
