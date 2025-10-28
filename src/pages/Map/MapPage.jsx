// src/pages/Map/MapPage.jsx
import React, { useState, useEffect } from 'react'; // Mantemos useEffect para calcular bounds
// 1. Importar useQuery
import { useQuery } from '@tanstack/react-query';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchPlacaLocations } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import Spinner from '../../components/Spinner/Spinner';
import './Map.css';

// Corrigir ícones Leaflet (inalterado)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ /* ... icon urls ... */ });

// Componente auxiliar ChangeView (inalterado)
function ChangeView({ bounds }) {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.isValid()) {
            map.fitBounds(bounds.pad(0.1));
        } else if (!bounds) {
             map.setView([-14.235, -51.925], 4); // Centro do Brasil se sem bounds
        }
    }, [map, bounds]);
    return null;
}

// Chave da Query para localizações
const locationsQueryKey = ['placaLocations'];

function MapPage() {
  const [mapBounds, setMapBounds] = useState(null); // Estado local para os limites calculados
  const showToast = useToast();

  // --- 2. useQuery para buscar localizações ---
  const {
    data: locationsData, // Dados brutos da API
    isLoading,         // Estado de loading
    isError,           // Estado de erro
    error,             // Objeto de erro
  } = useQuery({
    queryKey: locationsQueryKey,
    queryFn: fetchPlacaLocations,
    staleTime: 1000 * 60 * 5, // Cache de 5 minutos (exemplo)
    placeholderData: [], // Evita 'undefined'
    // A query só precisa buscar uma vez ao carregar a página
    // refetchOnWindowFocus: false, // Desativa refetch ao focar (opcional)
  });

  // --- 3. useEffect para processar dados e calcular bounds ---
  // Este useEffect agora depende dos dados do useQuery (locationsData)
  useEffect(() => {
    if (locationsData && !isLoading) { // Processa apenas quando os dados chegam e não está carregando
      const validLocations = locationsData.filter(loc => {
          if (loc.coordenadas && loc.coordenadas.includes(',')) {
              const coords = loc.coordenadas.split(',').map(coord => parseFloat(coord.trim()));
              const [lat, lng] = coords;
              // Validação robusta de coordenadas
              return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
          }
          console.warn(`[MapPage] Coordenadas inválidas ou ausentes para placa _id ${loc._id}`);
          return false;
      });

      if (validLocations.length > 0) {
        // Calcula os limites (bounds)
        const bounds = L.latLngBounds(validLocations.map(loc => {
            const [lat, lng] = loc.coordenadas.split(',').map(coord => parseFloat(coord.trim()));
            return [lat, lng];
        }));
        setMapBounds(bounds); // Atualiza o estado local dos bounds
      } else {
        setMapBounds(null); // Limpa bounds se não houver localizações válidas
        // Mostra toast apenas se não estiver em loading inicial e não houver localizações
        if(!isLoading) showToast('Nenhuma localização válida encontrada para exibir.', 'info');
      }
    } else if (!isLoading && !locationsData) {
        // Caso em que locationsData é null/undefined após loading (pode acontecer com erro não capturado)
        setMapBounds(null);
    }
  }, [locationsData, isLoading, showToast]); // Depende dos dados do useQuery


  // --- Renderização ---
  if (isLoading && !locationsData) { // Mostra Spinner principal só no carregamento inicial
    return (
      <div className="map-page">
        <div className="map-page__container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spinner message="A carregar mapa e localizações..." />
        </div>
      </div>
    );
  }

  if (isError) { // Se o useQuery falhar
    return (
      <div className="map-page">
        <div className="map-page__container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <p className="error-message">Erro ao carregar mapa: {error.message}</p>
        </div>
      </div>
    );
  }

  // Filtra novamente aqui para renderização (garante consistência se locationsData mudar)
  const validLocationsToRender = (locationsData || []).filter(loc => {
      // ... (mesma lógica de validação de coordenadas usada no useEffect) ...
      return loc.coordenadas && loc.coordenadas.includes(',') && !isNaN(parseFloat(loc.coordenadas.split(',')[0])) && !isNaN(parseFloat(loc.coordenadas.split(',')[1]));
  });


  return (
    <div className="map-page">
      <MapContainer center={[-14.235, -51.925]} zoom={4} className="map-page__container">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validLocationsToRender.map(loc => {
          const [lat, lng] = loc.coordenadas.split(',').map(coord => parseFloat(coord.trim()));
          return (
            <Marker key={loc._id} position={[lat, lng]}>
              <Popup>
                <h4>Placa: {loc.numero_placa || 'N/A'}</h4>
                <p>{loc.nomeDaRua || 'Endereço não informado'}</p>
                <a href={`/placas/${loc._id}`} onClick={(e) => { e.preventDefault(); navigate(`/placas/${loc._id}`); }} style={{ fontWeight: 500 }}>
                    Ver Detalhes
                </a>
              </Popup>
            </Marker>
          );
        })}
        {/* Passa os bounds calculados para ChangeView */}
        <ChangeView bounds={mapBounds} />
      </MapContainer>
    </div>
  );
}

export default MapPage;