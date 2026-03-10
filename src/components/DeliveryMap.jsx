import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete, Circle, GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { MapPin } from "lucide-react";
import logo from "../assets/amber-coffee-logo-only.png";

// Amber Coffee Location Coords
const SHOP_LOCATION = {
    lat: 4.181634,
    lng: 101.218805,
};

const DELIVERY_RADIUS_METERS = 2000;
const GOOGLE_MAP_LIBRARIES = ["places"];
const OUTSIDE_RANGE_MESSAGE = "Selected point is outside delivery range. Please choose within 2 km from the shop.";
const EARTH_RADIUS_METERS = 6378137;

const toRadians = (value) => (value * Math.PI) / 180;

const distanceInMeters = (pointA, pointB) => {
    const earthRadius = 6371000;
    const dLat = toRadians(pointB.lat - pointA.lat);
    const dLng = toRadians(pointB.lng - pointA.lng);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(pointA.lat)) *
            Math.cos(toRadians(pointB.lat)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);

    return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const normalizeLocation = (location) => {
    if (!location) return null;

    const lat = Number(location.lat);
    const lng = Number(location.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return { lat, lng };
};

const formatCoordinateAddress = (lat, lng) =>
    `Pinned at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;

const toDataUrl = (svgMarkup) =>
    `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgMarkup)}`;

const escapeXml = (value) =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

const latLngToWorldPoint = (lat, lng) => {
    const clampedSin = Math.min(
        Math.max(Math.sin((lat * Math.PI) / 180), -0.9999),
        0.9999,
    );
    return {
        x: (lng + 180) / 360,
        y: 0.5 - Math.log((1 + clampedSin) / (1 - clampedSin)) / (4 * Math.PI),
    };
};

const createUserPinSvg = () =>
    '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="56" viewBox="0 0 44 56"><path d="M22 2C12.611 2 5 9.611 5 19c0 12.266 17 33 17 33s17-20.734 17-33C39 9.611 31.389 2 22 2z" fill="#ef4444"/><circle cx="22" cy="19" r="11" fill="#dc2626"/><circle cx="22" cy="15.7" r="4.1" fill="#ffffff"/><path d="M14.6 24.8c0-4.087 3.313-7.4 7.4-7.4s7.4 3.313 7.4 7.4" fill="none" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round"/></svg>';

const createShopPinSvg = (logoUrl) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="56" viewBox="0 0 44 56"><defs><clipPath id="amberShopPinLogoClip"><circle cx="22" cy="19" r="9.4"/></clipPath></defs><path d="M22 2C12.611 2 5 9.611 5 19c0 12.266 17 33 17 33s17-20.734 17-33C39 9.611 31.389 2 22 2z" fill="#ffffff" stroke="#d6d3d1" stroke-width="1"/><circle cx="22" cy="19" r="10" fill="#ffffff" stroke="#d6d3d1" stroke-width="1.5"/>${logoUrl ? `<image href="${escapeXml(logoUrl)}" x="12.6" y="9.6" width="18.8" height="18.8" preserveAspectRatio="xMidYMid meet" clip-path="url(#amberShopPinLogoClip)"/>` : '<circle cx="22" cy="19" r="6.6" fill="#f97316"/>'}</svg>`;

export default function DeliveryMap({ address = "", selectedLocation = null, onAddressChange, onLocationChange }) {

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAP_LIBRARIES,
    });

    const mapRef = useRef(null);
    const mapListenersRef = useRef([]);
    const animationFrameRef = useRef(null);
    const autocompleteRef = useRef(null);
    const [marker, setMarker] = useState(() =>
        normalizeLocation(selectedLocation),
    );
    const [searchInput, setSearchInput] = useState(address || "");
    const [isResolvingAddress, setIsResolvingAddress] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [outsideOverlay, setOutsideOverlay] = useState(null);
    const [showOutsideRangeModal, setShowOutsideRangeModal] = useState(false);
    const [embeddedLogoDataUrl, setEmbeddedLogoDataUrl] = useState("");

    const updateOutsideOverlay = useCallback(() => {
        const map = mapRef.current;
        if (!map) return;

        const center = map.getCenter();
        const zoom = map.getZoom();
        const mapDiv = map.getDiv();

        if (!center || !Number.isFinite(zoom) || !mapDiv) return;

        const width = mapDiv.clientWidth;
        const height = mapDiv.clientHeight;
        if (!width || !height) return;

        const scale = 256 * Math.pow(2, zoom);

        const centerWorld = latLngToWorldPoint(center.lat(), center.lng());
        const shopWorld = latLngToWorldPoint(
            SHOP_LOCATION.lat,
            SHOP_LOCATION.lng,
        );

        const deltaLat =
            (DELIVERY_RADIUS_METERS / EARTH_RADIUS_METERS) * (180 / Math.PI);
        const edgeWorld = latLngToWorldPoint(
            SHOP_LOCATION.lat + deltaLat,
            SHOP_LOCATION.lng,
        );

        const centerPx = { x: centerWorld.x * scale, y: centerWorld.y * scale };
        const shopPx = { x: shopWorld.x * scale, y: shopWorld.y * scale };
        const edgePx = { x: edgeWorld.x * scale, y: edgeWorld.y * scale };

        const holeX = shopPx.x - centerPx.x + width / 2;
        const holeY = shopPx.y - centerPx.y + height / 2;
        const holeRadius = Math.hypot(shopPx.x - edgePx.x, shopPx.y - edgePx.y);

        setOutsideOverlay({ x: holeX, y: holeY, radius: holeRadius });
    }, []);

    const scheduleOutsideOverlayUpdate = useCallback(() => {
        if (animationFrameRef.current !== null) return;

        animationFrameRef.current = window.requestAnimationFrame(() => {
            animationFrameRef.current = null;
            updateOutsideOverlay();
        });
    }, [updateOutsideOverlay]);

    const shopMarkerIcon = useMemo(() => {
        if (!isLoaded || !window.google?.maps) return undefined;

        return {
            url: toDataUrl(createShopPinSvg(embeddedLogoDataUrl || logo || "")),
            scaledSize: new window.google.maps.Size(44, 56),
            anchor: new window.google.maps.Point(22, 56),
        };
    }, [embeddedLogoDataUrl, isLoaded]);

    const userMarkerIcon = useMemo(() => {
        if (!isLoaded || !window.google?.maps) return undefined;

        return {
            url: toDataUrl(createUserPinSvg()),
            scaledSize: new window.google.maps.Size(44, 56),
            anchor: new window.google.maps.Point(22, 56),
        };
    }, [isLoaded]);

    const isWithinDeliveryRadius = (candidate) => {
        return (
            distanceInMeters(SHOP_LOCATION, candidate) <= DELIVERY_RADIUS_METERS
        );
    };

    const reverseGeocode = async (candidate) => {
        if (!window.google?.maps) return "";

        return new Promise((resolve) => {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: candidate }, (results, status) => {
                if (status === "OK" && results?.[0]?.formatted_address) {
                    resolve(results[0].formatted_address);
                    return;
                }
                resolve("");
            });
        });
    };

    const applySelectedLocation = async (candidate, preferredAddress = "") => {
        if (!isWithinDeliveryRadius(candidate)) {
            setErrorMessage(OUTSIDE_RANGE_MESSAGE);
            setShowOutsideRangeModal(true);
            return false;
        }

        setErrorMessage("");
        setMarker(candidate);
        onLocationChange?.(candidate);

        let resolvedAddress = preferredAddress;

        setIsResolvingAddress(true);
        try {
            resolvedAddress =
                preferredAddress ||
                (await reverseGeocode(candidate)) ||
                formatCoordinateAddress(candidate.lat, candidate.lng);
        } finally {
            setIsResolvingAddress(false);
        }

        onAddressChange?.(resolvedAddress);
        setSearchInput(resolvedAddress);

        if (mapRef.current) {
            mapRef.current.panTo(candidate);
            if (mapRef.current.getZoom() < 15) {
                mapRef.current.setZoom(15);
            }
            scheduleOutsideOverlayUpdate();
        }

        return true;
    };

    const handleUseCurrentLocation = () => {
        if (!navigator?.geolocation) {
            setErrorMessage("Geolocation is not supported on this device.");
            return;
        }

        setErrorMessage("");
        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const candidate = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };

                await applySelectedLocation(candidate);
                setIsLocating(false);
            },
            (error) => {
                console.error("Geolocation error:", error);
                setErrorMessage(
                    "Unable to get current location. Please check location permission.",
                );
                setIsLocating(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 0,
            },
        );
    };

    const handleMapClick = (event) => {
        const lat = event?.latLng?.lat?.();
        const lng = event?.latLng?.lng?.();
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        applySelectedLocation({ lat, lng });
    };

    const handleSearchFallback = async (keyword) => {
        if (!keyword || !window.google?.maps) return;

        const geocoder = new window.google.maps.Geocoder();

        const result = await new Promise((resolve, reject) => {
            geocoder.geocode({ address: keyword }, (results, status) => {
                if (status === "OK" && results?.[0]) {
                    resolve(results[0]);
                    return;
                }
                reject(new Error(status));
            });
        });

        const location = result.geometry?.location;
        const lat = location?.lat?.();
        const lng = location?.lng?.();

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            throw new Error("INVALID_LOCATION");
        }

        await applySelectedLocation(
            { lat, lng },
            result.formatted_address || keyword,
        );
    };

    const handlePlaceChanged = async () => {
        const selectedPlace = autocompleteRef.current?.getPlace?.();
        const location = selectedPlace?.geometry?.location;
        const lat = location?.lat?.();
        const lng = location?.lng?.();

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return;
        }

        setErrorMessage("");
        await applySelectedLocation(
            { lat, lng },
            selectedPlace?.formatted_address ||
                selectedPlace?.name ||
                searchInput,
        );
    };

    const handleSearch = async (event) => {
        event.preventDefault();

        const keyword = searchInput.trim();
        if (!keyword || !window.google?.maps) return;

        setErrorMessage("");
        setIsResolvingAddress(true);

        try {
            const selectedPlace = autocompleteRef.current?.getPlace?.();
            const placeLocation = selectedPlace?.geometry?.location;

            if (placeLocation) {
                const lat = placeLocation.lat();
                const lng = placeLocation.lng();
                await applySelectedLocation(
                    { lat, lng },
                    selectedPlace?.formatted_address ||
                        selectedPlace?.name ||
                        keyword,
                );
            } else {
                await handleSearchFallback(keyword);
            }
        } catch (error) {
            console.error("Location search error:", error);
            setErrorMessage(
                "Address not found. Please refine your search and try again.",
            );
        } finally {
            setIsResolvingAddress(false);
        }
    };

        useEffect(() => {
        const normalized = normalizeLocation(selectedLocation);
        if (normalized) setMarker(normalized);
    }, [selectedLocation]);

    useEffect(() => {
        if (address) setSearchInput(address);
    }, [address]);

    useEffect(() => {
        let isCancelled = false;

        if (!logo || typeof window === "undefined") {
            setEmbeddedLogoDataUrl("");
            return;
        }

        const image = new Image();
        image.crossOrigin = "anonymous";

        image.onload = () => {
            if (isCancelled) return;

            try {
                const canvas = document.createElement("canvas");
                canvas.width = image.naturalWidth || image.width || 64;
                canvas.height = image.naturalHeight || image.height || 64;

                const context = canvas.getContext("2d");
                if (!context) {
                    setEmbeddedLogoDataUrl(logo);
                    return;
                }

                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                setEmbeddedLogoDataUrl(canvas.toDataURL("image/png"));
            } catch (error) {
                console.error("Failed to process logo image:", error);
                setEmbeddedLogoDataUrl(logo);
            }
        };

        image.onerror = () => {
            if (!isCancelled) {
                setEmbeddedLogoDataUrl(logo);
            }
        };

        image.src = logo;

        return () => {
            isCancelled = true;
        };
    }, []);

    useEffect(() => {
        return () => {
            if (animationFrameRef.current !== null) {
                window.cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    useEffect(() => {
        window.addEventListener("resize", scheduleOutsideOverlayUpdate);
        return () => {
            window.removeEventListener("resize", scheduleOutsideOverlayUpdate);
        };
    }, [scheduleOutsideOverlayUpdate]);

    if (loadError) {
        return (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                Unable to load Google Maps. Please refresh and try again.
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-500">
                Loading map...
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-stone-200 overflow-hidden bg-white shadow-sm">
            <div className="bg-linear-to-r from-orange-50 to-stone-50 border-b border-stone-200 p-3 space-y-2">
                <p className="text-[11px] text-stone-500">
                    Search or pin your exact delivery location.
                </p>

                <form
                    onSubmit={handleSearch}
                    className="flex items-center gap-2"
                >
                    <div className="relative flex-1">
                        <MapPin
                            className="absolute left-3 top-2.5 text-stone-400"
                            size={16}
                        />
                        <Autocomplete
                            onLoad={(autocomplete) => {
                                autocompleteRef.current = autocomplete;
                            }}
                            onPlaceChanged={handlePlaceChanged}
                            options={{
                                fields: [
                                    "geometry",
                                    "formatted_address",
                                    "name",
                                ],
                                componentRestrictions: { country: "my" },
                            }}
                        >
                            <input
                                value={searchInput}
                                onChange={(event) =>
                                    setSearchInput(event.target.value)
                                }
                                placeholder="Enter your address"
                                className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </Autocomplete>
                    </div>
                </form>

                <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className="w-full py-2.5 rounded-xl border border-stone-200 bg-white text-sm font-bold text-stone-700 hover:bg-stone-50 disabled:opacity-70"
                >
                    {isLocating ? "Detecting current location..." : "Use Current Location"}
                </button>
            </div>

            <div className="relative">
                <GoogleMap
                    zoom={13}
                    center={marker || SHOP_LOCATION}
                    mapContainerStyle={{ width: "100%", height: "340px" }}
                    onLoad={(map) => {
                        mapRef.current = map;

                        scheduleOutsideOverlayUpdate();
                        mapListenersRef.current = [
                            map.addListener(
                                "bounds_changed",
                                scheduleOutsideOverlayUpdate,
                            ),
                            map.addListener(
                                "zoom_changed",
                                scheduleOutsideOverlayUpdate,
                            ),
                            map.addListener(
                                "center_changed",
                                scheduleOutsideOverlayUpdate,
                            ),
                        ];
                    }}
                    onUnmount={() => {
                        mapListenersRef.current.forEach((listener) =>
                            listener?.remove?.(),
                        );
                        mapListenersRef.current = [];
                        if (animationFrameRef.current !== null) {
                            window.cancelAnimationFrame(
                                animationFrameRef.current,
                            );
                            animationFrameRef.current = null;
                        }
                        mapRef.current = null;
                    }}
                    onClick={handleMapClick}
                    options={{
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: true,
                        zoomControl: true,
                        clickableIcons: false,
                        gestureHandling: "greedy",
                    }}
                >
                    <Marker
                        position={SHOP_LOCATION}
                        icon={shopMarkerIcon}
                        title="Amber Coffee Shop"
                        zIndex={2}
                    />

                    <Circle
                        center={SHOP_LOCATION}
                        radius={DELIVERY_RADIUS_METERS}
                        options={{
                            clickable: false,
                            fillOpacity: 0,
                            strokeColor: "#f97316",
                            strokeOpacity: 0.9,
                            strokeWeight: 2,
                        }}
                    />

                    {marker && (
                        <Marker
                            position={marker}
                            draggable
                            icon={userMarkerIcon}
                            zIndex={3}
                            onDragEnd={(event) => {
                                const lat = event?.latLng?.lat?.();
                                const lng = event?.latLng?.lng?.();
                                if (
                                    !Number.isFinite(lat) ||
                                    !Number.isFinite(lng)
                                )
                                    return;

                                applySelectedLocation({ lat, lng });
                            }}
                        />
                    )}
                </GoogleMap>

                {outsideOverlay && (
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background:
                                "repeating-linear-gradient(45deg, rgba(239,68,68,0.24) 0px, rgba(239,68,68,0.24) 8px, rgba(239,68,68,0.08) 8px, rgba(239,68,68,0.08) 16px)",
                            WebkitMaskImage: `radial-gradient(circle ${outsideOverlay.radius}px at ${outsideOverlay.x}px ${outsideOverlay.y}px, transparent ${Math.max(outsideOverlay.radius - 1, 0)}px, black ${outsideOverlay.radius + 1}px)`,
                            maskImage: `radial-gradient(circle ${outsideOverlay.radius}px at ${outsideOverlay.x}px ${outsideOverlay.y}px, transparent ${Math.max(outsideOverlay.radius - 1, 0)}px, black ${outsideOverlay.radius + 1}px)`,
                        }}
                    />
                )}
            </div>

            <div className="p-3 bg-white border-t border-stone-100">
                <div className="flex justify-between gap-2 text-[11px]">
                    <span className="font-bold text-stone-500">
                        Delivery Radius: 2.0 km
                    </span>
                    <span className="text-stone-400 text-right truncate max-w-[65%]">
                        Tap map to drop a pin
                    </span>
                </div>
                {isResolvingAddress && (
                    <p className="mt-1 text-[11px] text-stone-500">
                        Updating address...
                    </p>
                )}
                {errorMessage && (
                    <p className="mt-1 text-[11px] font-medium text-red-500">
                        {errorMessage}
                    </p>
                )}
            </div>

            {showOutsideRangeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[1px]">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-stone-200">
                        <h3 className="text-base font-bold text-stone-800 mb-2">
                            Location Outside Delivery Range
                        </h3>
                        <p className="text-sm text-stone-600 leading-relaxed">
                            {OUTSIDE_RANGE_MESSAGE}
                        </p>
                        <button
                            onClick={() => setShowOutsideRangeModal(false)}
                            className="mt-4 w-full py-2.5 rounded-xl bg-primary text-white font-bold hover:opacity-90"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
