import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FaMapMarkerAlt, FaCrosshairs, FaTimes, FaCheck, FaSpinner } from 'react-icons/fa';

// Fix Leaflet marker icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Custom red marker for selected location
const selectedIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: 'hue-rotate-marker'
});

// Component to handle map click events
const MapClickHandler = ({ onLocationSelect }) => {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        }
    });
    return null;
};

// Component to fly to a location
const FlyToLocation = ({ position }) => {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, 16, { duration: 1.5 });
        }
    }, [position, map]);
    return null;
};

const LocationPicker = ({ latitude, longitude, onLocationSelect, onClose, isOpen, buttonLabel = "Set Location on Map", buttonColorClass = "blue" }) => {
    const [showMap, setShowMap] = useState(false);
    const [currentPos, setCurrentPos] = useState(
        latitude && longitude ? [latitude, longitude] : null
    );
    const [tempPos, setTempPos] = useState(
        latitude && longitude ? [latitude, longitude] : null
    );
    const [locating, setLocating] = useState(false);
    const [address, setAddress] = useState('');
    const [flyTarget, setFlyTarget] = useState(null);

    // Default center (Kathmandu, Nepal)
    const defaultCenter = [27.7172, 85.3240];

    const openMap = () => {
        setShowMap(true);
        setTempPos(currentPos);
        // Auto-detect location when opening map
        if (!currentPos) {
            detectLocation();
        }
    };

    const closeMap = () => {
        setShowMap(false);
        setTempPos(null);
        setAddress('');
    };

    const confirmLocation = () => {
        if (tempPos) {
            setCurrentPos(tempPos);
            onLocationSelect(tempPos[0], tempPos[1]);
            setShowMap(false);
        }
    };

    const handleMapClick = (lat, lng) => {
        setTempPos([lat, lng]);
        setFlyTarget([lat, lng]);
        reverseGeocode(lat, lng);
    };

    const detectLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setTempPos([lat, lng]);
                setFlyTarget([lat, lng]);
                reverseGeocode(lat, lng);
                setLocating(false);
            },
            (error) => {
                console.error("Geolocation error:", error);
                alert("Could not get your location. Please allow location access or click on the map to set location manually.");
                setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const reverseGeocode = async (lat, lng) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            if (data.display_name) {
                setAddress(data.display_name);
            }
        } catch (err) {
            console.error("Reverse geocode failed:", err);
            setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
    };

    // Color classes based on prop
    const colorMap = {
        blue: { bg: 'bg-blue-50/50', border: 'border-blue-200', text: 'text-blue-600', hoverBg: 'hover:bg-blue-50', iconBg: 'bg-blue-100' },
        green: { bg: 'bg-green-50/50', border: 'border-green-200', text: 'text-green-600', hoverBg: 'hover:bg-green-50', iconBg: 'bg-green-100' },
        red: { bg: 'bg-red-50/50', border: 'border-red-200', text: 'text-red-600', hoverBg: 'hover:bg-red-50', iconBg: 'bg-red-100' }
    };
    const colors = colorMap[buttonColorClass] || colorMap.blue;

    return (
        <>
            {/* Button / Selected Location Display */}
            {currentPos ? (
                <div className={`${colors.bg} border-2 border-solid ${colors.border} rounded-xl p-4 transition-colors`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`${colors.iconBg} ${colors.text} p-2.5 rounded-full`}>
                                <FaMapMarkerAlt size={16} />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800 text-sm">Location Set</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {currentPos[0].toFixed(6)}, {currentPos[1].toFixed(6)}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={openMap}
                            className={`px-4 py-2 rounded-lg ${colors.text} text-xs font-bold ${colors.bg} ${colors.hoverBg} border ${colors.border} transition-all duration-200 active:scale-95`}
                        >
                            Change
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={openMap}
                    className={`${colors.bg} border-2 border-dashed ${colors.border} rounded-xl p-8 flex flex-col items-center justify-center text-center ${colors.hoverBg} transition-colors cursor-pointer group`}
                >
                    <div className={`${colors.iconBg} ${colors.text} p-4 rounded-full mb-3 group-hover:scale-110 transition-transform`}>
                        <FaMapMarkerAlt size={24} />
                    </div>
                    <h4 className="font-bold text-gray-800">{buttonLabel}</h4>
                    <p className={`text-sm ${colors.text} opacity-80 mt-1`}>Click to open map and mark your exact location</p>
                </div>
            )}

            {/* Full Screen Map Modal */}
            {showMap && (
                <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Select Location</h3>
                                <p className="text-xs text-gray-500">Click on the map or use the locate button</p>
                            </div>
                            <button
                                onClick={closeMap}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <FaTimes className="text-gray-500" size={18} />
                            </button>
                        </div>

                        {/* Map */}
                        <div className="flex-1 relative">
                            <MapContainer
                                center={tempPos || defaultCenter}
                                zoom={tempPos ? 16 : 13}
                                style={{ height: '100%', width: '100%' }}
                                zoomControl={true}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    maxZoom={19}
                                />

                                <MapClickHandler onLocationSelect={handleMapClick} />
                                {flyTarget && <FlyToLocation position={flyTarget} />}

                                {tempPos && (
                                    <Marker position={tempPos}>
                                        <Popup>
                                            <div className="font-sans text-center">
                                                <p className="font-bold text-sm text-gray-800">Selected Location</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {tempPos[0].toFixed(6)}, {tempPos[1].toFixed(6)}
                                                </p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )}
                            </MapContainer>

                            {/* Locate Me Button (floating) */}
                            <button
                                type="button"
                                onClick={detectLocation}
                                disabled={locating}
                                className="absolute top-4 right-4 z-[1000] bg-white px-4 py-2.5 rounded-xl shadow-lg border border-gray-200 flex items-center gap-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {locating ? (
                                    <FaSpinner className="animate-spin text-blue-600" />
                                ) : (
                                    <FaCrosshairs className="text-blue-600" />
                                )}
                                {locating ? 'Locating...' : 'My Location'}
                            </button>
                        </div>

                        {/* Address Preview + Confirm */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                            {tempPos ? (
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FaMapMarkerAlt className="text-red-500 flex-shrink-0" size={14} />
                                            <p className="text-sm font-semibold text-gray-800 truncate">
                                                {address || `${tempPos[0].toFixed(6)}, ${tempPos[1].toFixed(6)}`}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-400 ml-5">
                                            Coordinates: {tempPos[0].toFixed(6)}, {tempPos[1].toFixed(6)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={confirmLocation}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 active:scale-95 flex-shrink-0"
                                    >
                                        <FaCheck size={14} />
                                        Confirm Location
                                    </button>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-2">
                                    Click on the map to select a location, or click "My Location" to auto-detect
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default LocationPicker;
