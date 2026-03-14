import { useState, useEffect, useCallback, useRef } from 'react';

interface GpsPosition {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
}

interface UseGpsTrackingOptions {
    /** Enable tracking on mount */
    enabled?: boolean;
    /** Interval in ms between location updates to server */
    updateInterval?: number;
    /** Callback when position is updated */
    onPositionUpdate?: (position: GpsPosition) => void;
}

/**
 * Hook to continuously track user's GPS position.
 * Used by driver during active deliveries.
 */
export function useGpsTracking(options: UseGpsTrackingOptions = {}) {
    const { enabled = false, updateInterval = 15000, onPositionUpdate } = options;
    const [position, setPosition] = useState<GpsPosition | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isTracking, setIsTracking] = useState(false);
    const watchIdRef = useRef<number | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const latestPositionRef = useRef<GpsPosition | null>(null);

    const startTracking = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by this browser.');
            return;
        }

        setIsTracking(true);
        setError(null);

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const newPosition: GpsPosition = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    timestamp: pos.timestamp,
                };
                setPosition(newPosition);
                latestPositionRef.current = newPosition;
            },
            (err) => {
                setError(err.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000,
            }
        );

        // Periodic callback for server updates
        if (onPositionUpdate) {
            intervalRef.current = setInterval(() => {
                if (latestPositionRef.current) {
                    onPositionUpdate(latestPositionRef.current);
                }
            }, updateInterval);
        }
    }, [onPositionUpdate, updateInterval]);

    const stopTracking = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsTracking(false);
    }, []);

    const getCurrentPosition = useCallback((): Promise<GpsPosition> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const newPosition: GpsPosition = {
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                        timestamp: pos.timestamp,
                    };
                    setPosition(newPosition);
                    latestPositionRef.current = newPosition;
                    resolve(newPosition);
                },
                (err) => {
                    setError(err.message);
                    reject(err);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }, []);

    useEffect(() => {
        if (enabled) {
            startTracking();
        }
        return () => stopTracking();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled]);

    return {
        position,
        error,
        isTracking,
        startTracking,
        stopTracking,
        getCurrentPosition,
    };
}
