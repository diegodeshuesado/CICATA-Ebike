
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Bike } from '../types';
import { COLORS } from '../constants';

// Fix for default marker icon
const customMarker = (color: string) => {
  const markerHtmlStyles = `
    background-color: ${color};
    width: 2rem;
    height: 2rem;
    display: block;
    left: -1rem;
    top: -1rem;
    position: relative;
    border-radius: 2rem 2rem 0;
    transform: rotate(45deg);
    border: 1px solid #FFFFFF;
  `;

  return L.divIcon({
    className: "my-custom-pin",
    iconAnchor: [0, 24],
    popupAnchor: [0, -36],
    html: `<span style="${markerHtmlStyles}" />`
  });
};

interface FleetMapProps {
  bikes: Bike[];
  center?: [number, number];
  zoom?: number;
}

const FleetMap: React.FC<FleetMapProps> = ({ bikes, center = [20.5888, -100.3899], zoom = 16 }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'activa': return COLORS.greenActive;
      case 'inactiva': return COLORS.redInactive;
      default: return COLORS.yellowMaint;
    }
  };

  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {bikes.map((bike) => (
        <Marker 
          key={bike.id} 
          position={[bike.ubicacion.lat, bike.ubicacion.lng]}
          icon={customMarker(getStatusColor(bike.estado))}
        >
          <Popup>
            <div style={{ padding: '5px' }}>
              <h3 style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{bike.id} - {bike.modelo}</h3>
              <p style={{ margin: '0' }}><strong>Batería:</strong> {bike.bateria}%</p>
              <p style={{ margin: '0' }}><strong>Velocidad:</strong> {bike.velocidad} km/h</p>
              <p style={{ margin: '0' }}><strong>Estado:</strong> {bike.estado}</p>
              <a href={`#/dashboard/bike/${bike.id}`} style={{ display: 'block', marginTop: '10px', color: COLORS.ipnGuinda, fontWeight: 'bold' }}>
                Ver Telemetría Completa
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default FleetMap;
