import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/lib/supabase';
import { AlertCircle, ChevronDown, X } from 'lucide-react';
import L from 'leaflet';
import { getColor } from '@/lib/rainUtils';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RainMapProps {
  viewMode: 'daily' | '5d';
  selectedDate: string;
}

function GeoLayer({ data, viewMode, selectedHacienda }: { data: any; viewMode: 'daily' | '5d'; selectedHacienda: string }) {
  const map = useMap();

  useEffect(() => {
    if (!data) return;

    const getVal = (feature: any): number | null => {
      const m = feature.properties.metric;
      if (!m) return null;
      const v = viewMode === 'daily' ? m?.rain_daily : m?.rain_5d;
      return v ?? null;
    };

    const filteredData = selectedHacienda
      ? { ...data, features: data.features.filter((f: any) => f.properties.nombre_hda === selectedHacienda) }
      : data;

    const layer = L.geoJSON(filteredData, {
      style: (feature: any) => {
        const val = getVal(feature);
        const sinDatos = val === null;
        return {
          fillColor: sinDatos ? '#444444' : getColor(val ?? 0),
          fillOpacity: sinDatos ? 0.4 : 0.72,
          weight: 0.8,
          opacity: 1,
          color: 'rgba(255,255,255,0.25)',
        };
      },
      onEachFeature: (feature: any, lyr: any) => {
        const val = getVal(feature);
        const sinDatos = val === null;
        const displayValue = val != null ? Number(val).toFixed(1) : '—';
        const color = sinDatos ? '#888888' : getColor(val ?? 0);
        const label = viewMode === 'daily' ? 'Lluvia del Día' : 'Acumulado 5 Días';

        lyr.on({
          mouseover: (e: any) => {
            e.target.setStyle({ fillOpacity: 0.92, weight: 2, color: '#fff' });
            e.target.bringToFront();
          },
          mouseout: (e: any) => {
            e.target.setStyle({
              fillColor: sinDatos ? '#444444' : getColor(val ?? 0),
              fillOpacity: sinDatos ? 0.4 : 0.72,
              weight: 0.8,
              opacity: 1,
              color: 'rgba(255,255,255,0.25)',
            });
          },
        });

        const popupContent = `
          <div style="font-family:system-ui,sans-serif;min-width:180px;padding:14px;background:#fff;border-radius:12px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f0f0f0;">
              <div style="width:10px;height:10px;border-radius:3px;background:${color};flex-shrink:0;"></div>
              <span style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;color:#374151;">Información del Lote</span>
            </div>
            <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:2px;">${feature.properties.nombre_hda}</div>
            <div style="font-size:11px;color:#6b7280;margin-bottom:6px;">Suerte <strong>${feature.properties.ste}</strong> · Zona <strong>${feature.properties.zona ?? '—'}</strong></div>
            <div style="font-size:11px;color:#6b7280;margin-bottom:12px;">Área: <strong>${feature.properties.area_ha ? Number(feature.properties.area_ha).toFixed(2) + ' ha' : '—'}</strong></div>
            <div style="background:${color}22;border:1px solid ${color}55;border-radius:8px;padding:10px;text-align:center;">
              <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${color};margin-bottom:4px;">${label}</div>
              <div style="font-size:26px;font-weight:900;color:${color};line-height:1;">
                ${sinDatos
                  ? '<span style="font-size:13px;font-weight:600;color:#888">Sin datos</span>'
                  : `${displayValue}<span style="font-size:12px;font-weight:600;"> mm</span>`
                }
              </div>
            </div>
          </div>`;

        lyr.bindPopup(L.popup({
          closeButton: false,
          className: 'rain-popup',
          maxWidth: 240,
          offset: [0, -4],
        }).setContent(popupContent));
      },
    });

    layer.addTo(map);

    if (selectedHacienda && filteredData.features.length > 0) {
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
      }
    }

    return () => { layer.remove(); };
  }, [data, viewMode, selectedHacienda, map]);

  return null;
}

export const RainMap: React.FC<RainMapProps> = ({ viewMode, selectedDate }) => {
  const [geoData, setGeoData] = useState<any>(null);
  const [haciendas, setHaciendas] = useState<string[]>([]);
  const [selectedHacienda, setSelectedHacienda] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ← nueva vista con geometrías propias y lot_id calculado
      const { data: lots, error: lotsError } = await supabase
        .from('lots')
        .select('id, nombre_hda, hda, ste, geom');
      if (lotsError) throw lotsError;

      const { data: metrics, error: metricsError } = await supabase
        .from('rainfall_metrics')
        .select('*')
        .eq('date', selectedDate);
      if (metricsError) throw metricsError;

      const metricMap = new Map(metrics?.map(m => [m.lot_id, m]));

      const uniqueHaciendas = Array.from(
        new Set(lots?.map(lot => lot.nombre_hda))
      ).filter(Boolean).sort() as string[];
      setHaciendas(uniqueHaciendas);

      setGeoData({
        type: 'FeatureCollection',
        features: lots?.map(lot => ({
          type: 'Feature',
          geometry: typeof lot.geom === 'string' ? JSON.parse(lot.geom) : lot.geom,
          properties: {
            ...lot,
            metric: metricMap.get(lot.id) ?? null,
          },
        })),
      });
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Error al conectar con la base de datos');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: '#111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ width: 48, height: 48, border: '4px solid rgba(34,197,94,.2)', borderTopColor: 'rgb(34,197,94)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#9ca3af', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Cargando mapa…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 16, padding: 24, textAlign: 'center', maxWidth: 320 }}>
          <AlertCircle className="text-red-500 mx-auto mb-3" size={40} />
          <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: 6 }}>Error de Conexión</h3>
          <p style={{ color: '#9ca3af', fontSize: 13 }}>{error}</p>
          <button onClick={fetchData} style={{ marginTop: 16, padding: '8px 20px', background: '#374151', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .rain-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: 0 8px 32px rgba(0,0,0,.22) !important;
          padding: 0 !important;
          border-radius: 12px !important;
        }
        .rain-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        .rain-popup .leaflet-popup-tip-container {
          display: none !important;
        }
      `}</style>
      <div style={{ position: 'absolute', inset: 0 }}>

        <div className="absolute top-4 left-4 z-[1000] bg-card/95 backdrop-blur-xl border border-border rounded-xl p-2 shadow-xl flex items-center gap-2">
          <span className="text-xs font-bold text-foreground pl-2 hidden sm:inline">Hacienda:</span>
          <div className="relative">
            <input
              type="text"
              className="bg-background border border-border rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground w-[200px] sm:w-64"
              placeholder="Buscar hacienda..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsDropdownOpen(true);
                if (e.target.value === '') setSelectedHacienda('');
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
            />
            {searchTerm ? (
              <X
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer z-10"
                size={14}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSearchTerm('');
                  setSelectedHacienda('');
                }}
              />
            ) : (
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={14} />
            )}

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-background border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto z-[1001] py-1">
                <div
                  className="px-3 py-2 text-xs text-foreground hover:bg-muted cursor-pointer transition-colors"
                  onMouseDown={() => {
                    setSearchTerm('');
                    setSelectedHacienda('');
                    setIsDropdownOpen(false);
                  }}
                >
                  Todas las haciendas
                </div>
                {haciendas
                  .filter(h => h.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(h => (
                    <div
                      key={h}
                      className="px-3 py-2 text-xs text-foreground hover:bg-muted cursor-pointer transition-colors"
                      onMouseDown={() => {
                        setSearchTerm(h);
                        setSelectedHacienda(h);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {h}
                    </div>
                  ))
                }
                {haciendas.filter(h => h.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground italic">No se encontraron resultados</div>
                )}
              </div>
            )}
          </div>
        </div>

        <MapContainer
          center={[3.92, -76.28]}
          zoom={11}
          zoomControl={false}
          style={{ height: '100%', width: '100%', background: '#1a1a1a' }}
        >
          <ZoomControl position="bottomright" />
          <TileLayer
            attribution='Tiles &copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          {geoData && <GeoLayer data={geoData} viewMode={viewMode} selectedHacienda={selectedHacienda} />}
        </MapContainer>
      </div>
    </>
  );
};