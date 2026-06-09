import { useState, useEffect } from "react";

export function useUserLocation() {
    const [location, setLocation] = useState<{
        lat: number;
        lng: number;
    } | null>(null);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocation({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                    });
                },
                () => {
                    // Silently ignore if the user denies location permission
                },
                { timeout: 5000, maximumAge: 60000 }
            );
        }
    }, []);

    return location;
}
