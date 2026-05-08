-- Alter the lots table to accept any geometry type (Polygon or MultiPolygon)
-- First, drop the constraint by changing to generic geometry
alter table public.lots 
alter column geom type geometry(Geometry, 4326);
