import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaSearchLocation, FaCheckCircle, FaExclamationCircle, FaTools, FaMapMarkerAlt, FaSpinner, FaDirections, FaExternalLinkAlt } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons for different statuses
const getBinIcon = (status) => {
    const colorMap = {
        available: 'green',
        full: 'red',
        maintenance: 'orange'
    };
    const color = colorMap[status] || 'gray';
    
    return L.divIcon({
        className: 'custom-bin-marker',
        html: `<div class="relative">
            <div class="w-6 h-6 rounded-full bg-${color}-500 border-2 border-white shadow-lg flex items-center justify-center">
                <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
            </div>
            <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-${color}-500 rounded-full"></div>
        </div>`,
        iconSize: [24, 32],
        iconAnchor: [12, 32]
    });
};

const FindDustbins = ({ onBack }) => {
    const [dustbins, setDustbins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [selectedBin, setSelectedBin] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDustbins();
        detectUserLocation();
    }, []);

    const fetchDustbins = async () => {
        try {
            // Try to fetch from API first
            const token = localStorage.getItem('token');
            if (token) {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/citizen/dustbins`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.dustbins && data.dustbins.length > 0) {
                        setDustbins(data.dustbins);
                        setLoading(false);
                        return;
                    }
                }
            }
            
            // If API fails or no data, use dummy data
            const dummyDustbins = [
                {
                    id: 1,
                    name: 'Park Avenue - General Waste Bin',
                    latitude: 26.6620,
                    longitude: 87.2710,
                    status: 'available',
                    dustbin_type: 'General'
                },
                {
                    id: 2,
                    name: 'Main Street - Public Bin',
                    latitude: 26.6615,
                    longitude: 87.2705,
                    status: 'available',
                    dustbin_type: 'Public'
                },
                {
                    id: 3,
                    name: 'Community Park - General Waste Bin',
                    latitude: 26.6630,
                    longitude: 87.2720,
                    status: 'available',
                    dustbin_type: 'General'
                },
                {
                    id: 4,
                    name: 'City Center - General Waste Bin',
                    latitude: 26.6600,
                    longitude: 87.2680,
                    status: 'full',
                    dustbin_type: 'General'
                },
                {
                    id: 5,
                    name: 'Main Street - Organic Waste Bin',
                    latitude: 26.6610,
                    longitude: 87.2700,
                    status: 'available',
                    dustbin_type: 'Organic'
                },
                {
                    id: 6,
                    name: 'Residential Area - Public Bin',
                    latitude: 26.6590,
                    longitude: 87.2670,
                    status: 'maintenance',
                    dustbin_type: 'Public'
                }
            ];
            setDustbins(dummyDustbins);
            setError(null);
        } catch (err) {
            console.error('Error fetching dustbins:', err);
            setError('Failed to load dustbins');
        } finally {
            setLoading(false);
        }
    };

    const detectUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.warn('Geolocation error:', error);
                    // Default to Biratnagar if location denied
                    setUserLocation([26.659744, 87.269277]);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            setUserLocation([26.659744, 87.269277]); // Default location
        }
    };

    const calculateDistance = (lat1, lng1, lat2, lng2) => {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return (R * c).toFixed(2);
    };

    const showInGoogleMaps = (bin) => {
        if (!bin) return;
        const url = `https://www.google.com/maps/search/?api=1&query=${bin.latitude},${bin.longitude}`;
        window.open(url, '_blank');
    };

    // Watch for location changes to update distances in real-time
    useEffect(() => {
        let watchId;
        
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    setUserLocation([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.warn('Location watch error:', error);
                },
                { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
            );
        }
        
        return () => {
            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, []);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'available': return 'bg-green-100 text-green-600';
            case 'full': return 'bg-red-100 text-red-600';
            case 'maintenance': return 'bg-yellow-100 text-yellow-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'available': return <FaCheckCircle />;
            case 'full': return <FaExclamationCircle />;
            case 'maintenance': return <FaTools />;
            default: return <FaCheckCircle />;
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="text-4xl text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Finding nearby dustbins...</p>
                    <p className="text-sm text-gray-500 mt-2">Detecting your location</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-2xl shadow-lg border border-gray-100 max-w-md">
                    <div className="text-red-500 mb-4">
                        <FaExclamationCircle className="text-5xl mx-auto" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Unable to Load Dustbins</h3>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={fetchDustbins}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <FaSearchLocation /> Try Again
                        </button>
                        <button 
                            onClick={onBack}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Add distance to each bin and sort by distance
    const dustbinsWithDistance = dustbins.map(bin => ({
        ...bin,
        distance: userLocation 
            ? calculateDistance(userLocation[0], userLocation[1], bin.latitude, bin.longitude)
            : '0.00'
    })).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    const mapCenter = userLocation || [26.659744, 87.269277];

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
            {/* Header - Blue Theme (matches citizen dashboard) */}
            <div className="mb-6">
                <button
                    onClick={onBack}
                    className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-4 transition-all duration-300 hover:scale-105 group"
                >
                    <FaArrowLeft className="mr-2 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
                </button>

                <div className="bg-blue-50 rounded-3xl p-8 border border-blue-100">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
                            <FaSearchLocation className="text-3xl" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Find Nearby Dustbins</h1>
                            <p className="text-gray-500 mt-1">Locate the nearest waste disposal points</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">

                {/* Map Section */}
                <div className="lg:w-2/3 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative z-0 h-96 lg:h-auto">
                    <MapContainer center={mapCenter} zoom={15} style={{ height: "100%", width: "100%" }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        
                        {/* User Location Marker */}
                        {userLocation && (
                            <Marker position={userLocation}>
                                <Popup>
                                    <div className="font-sans">
                                        <h3 className="font-bold text-blue-600">Your Location</h3>
                                        <p className="text-xs text-gray-500">Detected automatically</p>
                                    </div>
                                </Popup>
                            </Marker>
                        )}

                        {/* Dustbin Markers */}
                        {dustbinsWithDistance.map((bin) => (
                            <Marker
                                key={bin.id}
                                position={[bin.latitude, bin.longitude]}
                                icon={getBinIcon(bin.status)}
                                eventHandlers={{
                                    click: () => {
                                        setSelectedBin(bin);
                                    },
                                }}
                            >
                                <Popup>
                                    <div className="font-sans min-w-[200px]">
                                        <h3 className="font-bold text-gray-800 text-sm">{bin.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(bin.status)}`}>
                                                {getStatusIcon(bin.status)}
                                                <span className="ml-1 capitalize">{bin.status}</span>
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {bin.dustbin_type} Waste Bin
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {bin.distance} km away
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => showInGoogleMaps(bin)}
                                                className="flex-1 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                                            >
                                                <FaExternalLinkAlt size={10} />
                                                Open in Google Maps
                                            </button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>

                    {/* Floating Legend */}
                    <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-100 flex justify-between items-center text-xs sm:text-sm z-[1000]">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-green-500"></span> Available
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500"></span> Full
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-yellow-500"></span> Maintenance
                        </div>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 pb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 sticky top-0 bg-slate-50 py-2 z-10">
                        <FaMapMarkerAlt className="text-blue-600" /> Nearest Dustbins
                        {userLocation && (
                            <span className="text-sm font-normal text-gray-500 ml-auto">
                                {dustbinsWithDistance.length} found
                            </span>
                        )}
                    </h3>

                    {dustbinsWithDistance.map((bin) => (
                        <div
                            key={bin.id}
                            onClick={() => setSelectedBin(bin)}
                            className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-md
                                ${selectedBin?.id === bin.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100'}
                            `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-gray-800 text-sm leading-tight">{bin.name}</h4>
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${getStatusStyle(bin.status)}`}>
                                    {getStatusIcon(bin.status)}
                                    <span className="ml-1">{bin.status}</span>
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                    <FaMapMarkerAlt />
                                </span>
                                <span>{bin.dustbin_type}</span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    showInGoogleMaps(bin);
                                }}
                                className="mt-3 w-full py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                            >
                                <FaExternalLinkAlt size={10} />
                                Show in Google Maps
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FindDustbins;
