// src/components/PlacaMap/PlacaMap.jsx
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Corrigir ícones Leaflet (pode ser repetido ou movido para um helper global se preferir)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Componente para invalidar tamanho do mapa
function InvalidateMapSize() {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
             if(map) map.invalidateSize();
        }, 100); // Pequeno delay para garantir que o layout estabilizou
        return () => clearTimeout(timer);
    }, [map]);
    return null;
}

// Componente do Mapa
function PlacaMap({ mapPosition, numeroPlaca }) {

    // Renderiza o mapa apenas se a posição for válida
    if (mapPosition && mapPosition.length === 2) {
        return (
            <MapContainer
                center={mapPosition}
                zoom={15}
                style={{ height: '100%', width: '100%' }} // Ocupa o container pai
            >
                <InvalidateMapSize /> {/* Garante o tamanho correto */}
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={mapPosition}>
                    <Popup>{numeroPlaca || 'Localização'}</Popup>
                </Marker>
            </MapContainer>
        );
    }

    // Renderiza uma mensagem se as coordenadas forem inválidas
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-color-light)' }}>
            <p>Mapa indisponível (coordenadas inválidas).</p>
        </div>
    );
}

PlacaMap.propTypes = {
    // Array de números [latitude, longitude] ou null/undefined
    mapPosition: PropTypes.arrayOf(PropTypes.number),
    numeroPlaca: PropTypes.string
};

export default PlacaMap;