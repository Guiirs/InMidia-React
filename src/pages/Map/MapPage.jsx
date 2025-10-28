// src/pages/MapPage.jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'; // Componentes do React-Leaflet
import L from 'leaflet'; // Importa o Leaflet
import { fetchPlacaLocations } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import Spinner from '../../components/Spinner/Spinner';
import './Map.css'; // CSS da página

// Corrige problema comum com ícones do marcador no React-Leaflet/Webpack/Vite
// (Pode não ser necessário dependendo da versão/configuração, mas é seguro incluir)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Componente auxiliar para ajustar limites do mapa após carregar marcadores
function ChangeView({ bounds }) {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.isValid()) {
            map.fitBounds(bounds.pad(0.1)); // Ajusta com padding
        } else if (!bounds) {
            // Se não houver limites (sem marcadores), centraliza no Brasil
             map.setView([-14.235, -51.925], 4);
        }
        // Não precisa de map.invalidateSize() aqui geralmente, react-leaflet lida bem
    }, [map, bounds]); // Re-executa se bounds mudar

    return null; // Este componente não renderiza nada visualmente
}


function MapPage() {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapBounds, setMapBounds] = useState(null); // Para guardar os limites dos marcadores
  const showToast = useToast();

  // Busca as localizações
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setMapBounds(null); // Reseta os limites

    fetchPlacaLocations()
      .then(data => {
        const validLocations = data.filter(loc => {
            if (loc.coordenadas && loc.coordenadas.includes(',')) {
                const coords = loc.coordenadas.split(',').map(coord => parseFloat(coord.trim()));
                const [lat, lng] = coords;
                return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
            }
            console.warn(`[MapPage] Coordenadas inválidas ou ausentes para placa _id ${loc._id}`);
            return false;
        });

        setLocations(validLocations);

        if (validLocations.length > 0) {
          // Calcula os limites (bounds) para ajustar o mapa
          const bounds = L.latLngBounds(validLocations.map(loc => {
              const [lat, lng] = loc.coordenadas.split(',').map(coord => parseFloat(coord.trim()));
              return [lat, lng];
          }));
          setMapBounds(bounds);
        } else {
          showToast('Nenhuma localização de placa encontrada para exibir no mapa.', 'info');
        }
      })
      .catch(err => {
        setError(err.message);
        showToast(err.message || 'Erro ao carregar localizações.', 'error');
      })
      .finally(() => setIsLoading(false));
  }, [showToast]); // Dependência showToast

  // Renderização
  if (isLoading) {
    return (
      <div className="map-page">
        <div className="map-page__container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spinner message="A carregar mapa e localizações..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-page">
        <div className="map-page__container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <p className="error-message">Erro ao carregar mapa: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-page">
      {/* O MapContainer ocupa o espaço do pai (.map-page__container) */}
      <MapContainer center={[-14.235, -51.925]} zoom={4} className="map-page__container">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map(loc => {
          const [lat, lng] = loc.coordenadas.split(',').map(coord => parseFloat(coord.trim()));
          // Usa _id como key
          return (
            <Marker key={loc._id} position={[lat, lng]}>
              <Popup>
                <h4>Placa: {loc.numero_placa || 'N/A'}</h4>
                <p>{loc.nomeDaRua || 'Endereço não informado'}</p>
                {/* Link interno React */}
                <a href={`/placas/${loc._id}`} onClick={(e) => { e.preventDefault(); window.location.href = `/placas/${loc._id}`; }} style={{ fontWeight: 500 }}>
                    Ver Detalhes
                </a>
              </Popup>
            </Marker>
          );
        })}
        {/* Componente para ajustar a visão do mapa */}
        <ChangeView bounds={mapBounds} />
      </MapContainer>
    </div>
  );
}

export default MapPage;