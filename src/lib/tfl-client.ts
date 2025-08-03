'use client';

import { StopPoint, Line, Arrival } from "@/models/tfl";

// Client-side cache management using localStorage
const CACHE_KEY = 'tubeStationsCache';
const CACHE_DURATION_HOURS = 24;

interface CacheData {
    lastUpdated: string;
    data: any;
}

function getCachedData(): CacheData | null {
    if (typeof window === 'undefined') return null;
    
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        return cached ? JSON.parse(cached) : null;
    } catch (error) {
        console.warn('Failed to read cache from localStorage:', error);
        return null;
    }
}

function setCachedData(data: any): void {
    if (typeof window === 'undefined') return;
    
    try {
        const cacheData: CacheData = {
            lastUpdated: new Date().toISOString(),
            data: data
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        console.log('Successfully updated cache with raw tube stations data');
    } catch (error) {
        console.warn('Failed to update cache:', error);
    }
}

function isCacheValid(cacheData: CacheData): boolean {
    const lastUpdated = new Date(cacheData.lastUpdated);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate < CACHE_DURATION_HOURS;
}

async function fetchRawTubeStationsFromAPI(): Promise<any> {
    // Get API key from client-side environment variable
    const appKey = process.env.NEXT_PUBLIC_TFL_APP_KEY;
    if (!appKey) {
        console.error('NEXT_PUBLIC_TFL_APP_KEY is not defined in the environment variables');
        return null;
    }
    const response = await fetch(`https://api.tfl.gov.uk/StopPoint/Mode/tube?app_key=${appKey}`);
    if (!response.ok) {
        console.error('Failed to fetch tube stations');
        return null;
    }
    return await response.json();
}

function extractStation(rawData: any): StopPoint {
    const tubeModeGroup = rawData.lineModeGroups.find((group: any) => group.modeName === 'tube');
    const lines: Line[] = [];
    if (tubeModeGroup && tubeModeGroup.lineIdentifier) {
        if (rawData.lines) {
            rawData.lines.forEach((line: any) => {
                if (tubeModeGroup.lineIdentifier.includes(line.id)
                    && !lines.some(l => l.id === line.id)) {
                            lines.push({
                                id: line.id,
                                name: line.name
                            });
                        }
                    });
                }
            }
    const platformCount = rawData.children ? rawData.children.filter((child: any) => child.stopType === 'NaptanMetroPlatform').length : 0;
    return {
        id: rawData.id,
        name: rawData.commonName.replace(/ Underground Station$/, '').trim(),
        lines: lines,
        platformCount: platformCount
    }
}

function extractStations(rawData: any): StopPoint[] {
    if (!rawData || !rawData.stopPoints) {
        return [];
    }
    return rawData.stopPoints
        .filter((station: any) => station.stopType === 'NaptanMetroStation')
        .map((station: any) => extractStation(station));
}

export async function getTubeStations(): Promise<StopPoint[]> {
    // Check if cache exists and is fresh
    const cacheData = getCachedData();
    
    if (cacheData && isCacheValid(cacheData)) {
        console.log('Using cached tube stations data');
        return extractStations(cacheData.data);
    }

    // Fetch fresh raw data from API
    const rawData = await fetchRawTubeStationsFromAPI();

    if (!rawData) {
        return [];
    }

    // Update cache with fresh raw data
    setCachedData(rawData);

    return extractStations(rawData);
}

export async function cacheTubeStations(): Promise<void> {
    try {
        const rawData = await fetchRawTubeStationsFromAPI();
        if (!rawData) {
            throw new Error('Failed to fetch raw data from API');
        }
        
        setCachedData(rawData);
        const processedStations = extractStations(rawData);
        console.log(`Successfully cached raw tube stations data (${processedStations.length} stations) to localStorage`);
    } catch (error) {
        console.error('Failed to cache tube stations:', error);
        throw error;
    }
}

function extractLines(rawData: any): Line[] {
    if (!rawData || !rawData.stopPoints) {
        return [];
    }
    const lines: Line[] = [];
    const stations = rawData.stopPoints
        .filter((station: any) => station.stopType === 'NaptanMetroStation');
    stations.forEach((station: any) => {
        if (station.lineModeGroups) {
            const tubeModeGroup = station.lineModeGroups.find((group: any) => group.modeName === 'tube');
            if (tubeModeGroup && tubeModeGroup.lineIdentifier) {
                if (station.lines) {
                    station.lines.forEach((line: any) => {
                        if (tubeModeGroup.lineIdentifier.includes(line.id)
                            && !lines.some(l => l.id === line.id)) {
                            lines.push({
                                id: line.id,
                                name: line.name
                            });
                        }
                    });
                }
            }
        }
    });
    return lines;
}

export async function getTubeLines(): Promise<Line[]> {
    // Check if cache exists and is fresh
    const cacheData = getCachedData();
    
    if (cacheData && isCacheValid(cacheData)) {
        console.log('Using cached tube stations data');
        return extractLines(cacheData.data);
    }

    // Fetch fresh raw data from API
    const rawData = await fetchRawTubeStationsFromAPI();

    if (!rawData) {
        return [];
    }

    // Update cache with fresh raw data
    setCachedData(rawData);

    return extractLines(rawData);
}

function extractArrival(rawData: any): Arrival {
    return {
        id: rawData.id,
        line: {
            id: rawData.lineId,
            name: rawData.lineName
        },
        direction: rawData.direction,
        towards: rawData.towards,
        timeToStation: rawData.timeToStation
    };
}

function extractArrivals(rawData: any): Arrival[] {
    if (!Array.isArray(rawData)) {
        return [];
    }
    return rawData.map(item => extractArrival(item));
}

export async function getArrivalsForStation(stationId: string, platform: number = -1, limit: number = 6): Promise<any> {
    const appKey = process.env.NEXT_PUBLIC_TFL_APP_KEY;
    if (!appKey) {
        console.error('NEXT_PUBLIC_TFL_APP_KEY is not defined in the environment variables');
        return null;
    }
    const response = await fetch(`https://api.tfl.gov.uk/StopPoint/${stationId}/Arrivals?app_key=${appKey}`);
    if (!response.ok) {
        console.error('Failed to fetch arrivals for station:', stationId);
        return [];
    }
    let arrivals = await response.json();
    if (platform > 0) {
        arrivals = arrivals.filter((arrival: any) => arrival.platformName.endsWith(`Platform ${platform}`));
    }
    arrivals.sort((a: Arrival, b: Arrival) => a.timeToStation - b.timeToStation);
    if (limit > 0) {
        arrivals = arrivals.slice(0, limit);
    }
    const extractedArrivals = extractArrivals(arrivals);
    return extractedArrivals;
}

export async function getStationById(stationId: string): Promise<StopPoint | null> {
    const stations = await getTubeStations();
    return stations.find(station => station.id === stationId) || null;
}