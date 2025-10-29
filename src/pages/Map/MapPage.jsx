// src/pages/Map/MapPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import já existente
import { useQuery } from '@tanstack/react-query'; //

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'; //
import L from 'leaflet';
import { fetchPlacaLocations } from '../../services/api'; //
import { useToast } from '../../components/ToastNotification/ToastNotification'; //
import Spinner from '../../components/Spinner/Spinner'; //
import './Map.css'; //

// Corrigir ícones Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
}); //

// Componente auxiliar ChangeView
function ChangeView({ bounds }) { //
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.isValid()) {
            map.fitBounds(bounds.pad(0.1));
        } else if (!bounds) {
             map.setView([-14.235, -51.925], 4);
        }
    }, [map, bounds]);
    return null;
}

const locationsQueryKey = ['placaLocations']; //

function MapPage() {
  const navigate = useNavigate(); // Hook já inicializado
  const [mapBounds, setMapBounds] = useState(null); //
  const showToast = useToast();

  const { //
    data: locationsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: locationsQueryKey,
    queryFn: fetchPlacaLocations,
    staleTime: 1000 * 60 * 5,
    placeholderData: [],
  });

  useEffect(() => { //
    if (locationsData && !isLoading) {
      const validLocations = locationsData.filter(loc => {
          if (loc.coordenadas && loc.coordenadas.includes(',')) {
              const coords = loc.coordenadas.split(',').map(coord => parseFloat(coord.trim()));
              const [lat, lng] = coords;
              // Validação robusta de coordenadas E do ID
              const placaId = loc.id || loc._id; // <<< Adiciona verificação do ID aqui
              return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && placaId;
          }
          console.warn(`[MapPage] Coordenadas ou ID inválidos para o item:`, loc);
          return false;
      });

      if (validLocations.length > 0) {
        const bounds = L.latLngBounds(validLocations.map(loc => {
            const [lat, lng] = loc.coordenadas.split(',').map(coord => parseFloat(coord.trim()));
            return [lat, lng];
        }));
        setMapBounds(bounds);
      } else {
        setMapBounds(null);
        if(!isLoading) showToast('Nenhuma localização válida encontrada para exibir.', 'info');
      }
    } else if (!isLoading && !locationsData) {
        setMapBounds(null);
    }
  }, [locationsData, isLoading, showToast]);


  // --- Renderização ---
  if (isLoading && !locationsData) { /* ... (Spinner) ... */ } //
  if (isError) { /* ... (Error) ... */ } //

  // Filtra novamente aqui para renderização
  const validLocationsToRender = (locationsData || []).filter(loc => { //
      const placaId = loc.id || loc._id;
      return placaId && loc.coordenadas && loc.coordenadas.includes(',') && !isNaN(parseFloat(loc.coordenadas.split(',')[0])) && !isNaN(parseFloat(loc.coordenadas.split(',')[1]));
  });


  return (
    <div className="map-page"> {/* */}
      <MapContainer center={[-14.235, -51.925]} zoom={4} className="map-page__container"> {/* */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validLocationsToRender.map(loc => {
          const [lat, lng] = loc.coordenadas.split(',').map(coord => parseFloat(coord.trim()));
          // <<< CORREÇÃO AQUI: Usa 'id' ou '_id' >>>
          const placaId = loc.id || loc._id;
          
          return (
            <Marker key={placaId} position={[lat, lng]}>
              <Popup>
                <h4>Placa: {loc.numero_placa || 'N/A'}</h4>
                <p>{loc.nomeDaRua || 'Endereço não informado'}</p>
                {/* <<< CORREÇÃO AQUI: Usa a variável 'placaId' >>> */}
                <a href={`/placas/${placaId}`} onClick={(e) => { e.preventDefault(); navigate(`/placas/${placaId}`); }} style={{ fontWeight: 500 }}>
                    Ver Detalhes
                </a>
              </Popup>
            </Marker>
          );
        })}
        <ChangeView bounds={mapBounds} />
      </MapContainer>
    </div>
  );
}

export default MapPage;