-- Catalog: categories, measurement definitions, products and their colours, images,
-- sizes and required measurements, and collections. Public reads published rows only;
-- admins manage everything.

create table public.categories (
  id text primary key check (id ~ '^[a-z-]+$'),
  name_sq text not null,
  name_en text not null,
  intro_sq text,
  intro_en text,
  banner_image_path text,
  sort integer not null default 0
);

-- Every measurement the wizard can ask for. Ranges are in centimetres.
create table public.measurement_definitions (
  id text primary key check (id ~ '^[a-z_]+$'),
  kind text not null check (kind in ('around', 'straight', 'heel')),
  view text not null check (view in ('front', 'back', 'side', 'shoe')),
  label_sq text not null,
  label_en text not null,
  hint_sq text not null,
  hint_en text not null,
  min_cm numeric(5, 1) not null,
  max_cm numeric(5, 1) not null,
  -- true: asked for every dress; false: only when a product requires it
  always_required boolean not null default false,
  sort integer not null default 0,
  check (min_cm >= 0 and max_cm > min_cm)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  category_id text not null references public.categories (id),
  name_sq text not null,
  name_en text not null,
  description_sq text not null default '',
  description_en text not null default '',
  fabric_care_sq text not null default '',
  fabric_care_en text not null default '',
  price_cents integer not null check (price_cents > 0),
  availability text not null default 'made_to_order' check (availability in ('in_stock', 'made_to_order')),
  production_weeks integer check (production_weeks between 1 and 52),
  length text not null check (length in ('mini', 'knee', 'midi', 'floor')),
  sleeves text not null check (sleeves in ('sleeveless', 'short', 'long')),
  silhouette text,
  published boolean not null default false,
  featured boolean not null default false,
  published_at timestamptz,
  seo_title_sq text,
  seo_title_en text,
  seo_description_sq text,
  seo_description_en text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (availability = 'in_stock' or production_weeks is not null)
);

create index products_category_idx on public.products (category_id) where published;
create index products_published_at_idx on public.products (published_at desc) where published;

create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name_sq text not null,
  name_en text not null,
  hex text not null check (hex ~ '^#[0-9A-Fa-f]{6}$'),
  -- filter family, e.g. ivory, black, blush
  family text not null,
  sort integer not null default 0
);
create index product_colors_product_idx on public.product_colors (product_id);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  color_id uuid references public.product_colors (id) on delete set null,
  storage_path text not null,
  alt_sq text not null default '',
  alt_en text not null default '',
  width integer,
  height integer,
  sort integer not null default 0
);
create index product_images_product_idx on public.product_images (product_id, sort);

-- Standard sizes and stock. "Custom size" is always offered and is not a row here.
create table public.product_sizes (
  product_id uuid not null references public.products (id) on delete cascade,
  size text not null check (size in ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  stock integer not null default 0 check (stock >= 0),
  primary key (product_id, size)
);

-- Conditional measurements a product needs on top of the always-required ones.
create table public.product_measurements (
  product_id uuid not null references public.products (id) on delete cascade,
  measurement_id text not null references public.measurement_definitions (id),
  primary key (product_id, measurement_id)
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name_sq text not null,
  name_en text not null,
  description_sq text,
  description_en text,
  image_path text,
  published boolean not null default false,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger collections_updated_at before update on public.collections
  for each row execute function public.set_updated_at();

create table public.collection_products (
  collection_id uuid not null references public.collections (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  sort integer not null default 0,
  primary key (collection_id, product_id)
);

-- RLS -----------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.measurement_definitions enable row level security;
alter table public.products enable row level security;
alter table public.product_colors enable row level security;
alter table public.product_images enable row level security;
alter table public.product_sizes enable row level security;
alter table public.product_measurements enable row level security;
alter table public.collections enable row level security;
alter table public.collection_products enable row level security;

create policy "Categories: public read" on public.categories for select to anon, authenticated using (true);
create policy "Measurements: public read" on public.measurement_definitions for select to anon, authenticated using (true);
create policy "Products: public read published" on public.products
  for select to anon, authenticated using (published or (select public.is_admin()));

-- Child rows are visible when their product is.
create policy "Colors: public read" on public.product_colors for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or (select public.is_admin()))));
create policy "Images: public read" on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or (select public.is_admin()))));
create policy "Sizes: public read" on public.product_sizes for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or (select public.is_admin()))));
create policy "Product measurements: public read" on public.product_measurements for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or (select public.is_admin()))));
create policy "Collections: public read published" on public.collections
  for select to anon, authenticated using (published or (select public.is_admin()));
create policy "Collection products: public read" on public.collection_products for select to anon, authenticated
  using (exists (select 1 from public.collections c where c.id = collection_id and (c.published or (select public.is_admin()))));

do $$
declare t text;
begin
  foreach t in array array[
    'categories', 'measurement_definitions', 'products', 'product_colors', 'product_images',
    'product_sizes', 'product_measurements', 'collections', 'collection_products'
  ] loop
    execute format(
      'create policy "%1$s: admin manages" on public.%1$I for all to authenticated
         using ((select public.is_admin())) with check ((select public.is_admin()))', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;
