-- Enable the PostGIS extension to handle geometries
create extension if not exists postgis;

-- Table for lots (static data + geometry)
create table if not exists public.lots (
    id text primary key, -- cod_unico from API
    hda text,
    ste text,
    nombre_hda text,
    geom geometry(MultiPolygon, 4326),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Table for historical rainfall data
create table if not exists public.rainfall_metrics (
    id uuid primary key default gen_random_uuid(),
    lot_id text references public.lots(id) on delete cascade,
    date date not null,
    rain_daily float8,
    rain_5d float8,
    created_at timestamptz default now(),
    
    -- Ensure we don't have duplicate records for the same lot and day
    unique(lot_id, date)
);

-- Enable RLS
alter table public.lots enable row level security;
alter table public.rainfall_metrics enable row level security;

-- Policies (Allow authenticated users to read)
create policy "Allow authenticated users to read lots"
on public.lots for select
to authenticated
using (true);

create policy "Allow authenticated users to read metrics"
on public.rainfall_metrics for select
to authenticated
using (true);

-- Indexes for performance
create index if not exists lots_geom_idx on public.lots using gist(geom);
create index if not exists rainfall_metrics_date_idx on public.rainfall_metrics(date);
create index if not exists rainfall_metrics_lot_id_idx on public.rainfall_metrics(lot_id);
