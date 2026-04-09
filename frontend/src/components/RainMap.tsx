import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';
import L from 'leaflet';

// Fix Leaflet icon issue
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

export const RainMap: React.FC<RainMapProps> = ({ viewMode, selectedDate }) => {
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // 1. Fetch Lots geometries
      const { data: lots, error: lotsError } = await supabase
        .from('lots')
        .select('id, hda, ste, nombre_hda, geom');
      
      if (lotsError) {
        console.error('Error fetching lots:', lotsError);
        setLoading(false);
        return;
      }

      // 2. Fetch Metrics for the selected date
      const { data: metrics, error: metricsError } = await supabase
        .from('rainfall_metrics')
        .select('*')
        .eq('date', selectedDate);

      if (metricsError) {
        console.error('Error fetching metrics:', metricsError);
        setLoading(false);
        return;
      }

      // 3. Map metrics to lots and build FeatureCollection
      const metricMap = new Map(metrics?.map(m => [m.lot_id, m]));
      
      const featureCollection = {
        type: 'FeatureCollection',
        features: lots?.map(lot => ({
          type: 'Feature',
          geometry: lot.geom,
          properties: {
            ...lot,
            metric: metricMap.get(lot.id)
          }
        }))
      };

      setGeoData(featureCollection);
      setLoading(false);
    };

    fetchData();
  }, [selectedDate]);

  const getColor = (value: number) => {
    return value > 50  ? '#08306b' :
           value > 30  ? '#08519c' :
           value > 20  ? '#2171b5' :
           value > 10  ? '#4292c6' :
           value > 5   ? '#6baed6' :
           value > 1   ? '#9ecae1' :
           value > 0   ? '#c6dbef' :
                         '#f7fbff';
  };

  const style = (feature: any) => {
    const metric = feature.properties.metric;
    const value = viewMode === 'daily' ? metric?.rain_daily : metric?.rain_5d;
    return {
      fillColor: getColor(value || 0),
      weight: 1,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.7
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const metric = feature.properties.metric;
    const value = viewMode === 'daily' ? metric?.rain_daily : metric?.rain_5d;
    layer.bindPopup(`
      <div class="text-slate-900">
        <h3 class="font-bold border-b pb-1 mb-2">Hacienda: ${feature.properties.nombre_hda}</h3>
        <p><b>Suerte:</b> ${feature.properties.ste}</p>
        <p><b>Lluvia:</b> ${value || 0} mm</p>
        <p><b>Fecha:</b> ${selectedDate}</p>
      </div>
    `);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      <MapContainer 
        center={[3.6, -76.3]} 
        zoom={11} 
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {geoData && (
          <GeoJSON 
            data={geoData} 
            style={style} 
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
    </div>
  );
};
