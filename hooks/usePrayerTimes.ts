'use client';

import { useState, useEffect } from 'react';

export interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

// Static Fallback for Jakarta (Approximate standard times)
const JAKARTA_FALLBACK: PrayerTimes = {
  Fajr: '04:45',
  Dhuhr: '12:05',
  Asr: '15:15',
  Maghrib: '18:05',
  Isha: '19:15'
};

export function usePrayerTimes(city: string = 'Jakarta', country: string = 'Indonesia') {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchPrayerTimes = async () => {
      try {
        setIsLoading(true);
        const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=11`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) throw new Error('API unreachable');
        
        const data = await response.json();
        
        if (data?.data?.timings) {
          if (isMounted) {
            setPrayerTimes({
              Fajr: data.data.timings.Fajr,
              Dhuhr: data.data.timings.Dhuhr,
              Asr: data.data.timings.Asr,
              Maghrib: data.data.timings.Maghrib,
              Isha: data.data.timings.Isha
            });
            setError(null);
          }
        } else {
          throw new Error('Invalid data');
        }
      } catch (err: any) {
        console.warn('[usePrayerTimes] Fetch failed, using Jakarta fallback.', err);
        if (isMounted) {
          // Use fallback if API fails
          setPrayerTimes(JAKARTA_FALLBACK);
          setError(null); // Clear error since we have a fallback
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPrayerTimes();
    
    return () => {
      isMounted = false;
    };
  }, [city, country]);

  return { prayerTimes, isLoading, error };
}
