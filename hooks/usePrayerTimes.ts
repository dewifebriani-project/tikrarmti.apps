'use client';

import { useState, useEffect } from 'react';

export interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export interface HijriDate {
  date: string;
  day: string;
  month: string;
  year: string;
  designation: string;
}

export interface GregorianDate {
  date: string;
  day: string;
  month: string;
  year: string;
}

const JAKARTA_FALLBACK: PrayerTimes = {
  Fajr: '04:45',
  Dhuhr: '12:05',
  Asr: '15:15',
  Maghrib: '18:05',
  Isha: '19:15'
};

export function usePrayerTimes() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [hijriDate, setHijriDate] = useState<HijriDate | null>(null);
  const [gregorianDate, setGregorianDate] = useState<GregorianDate | null>(null);
  const [locationName, setLocationName] = useState<string>('Jakarta');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLocationAndPrayers = async () => {
      try {
        setIsLoading(true);

        // 1. Get Coordinates from Geolocation
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 3600000 // 1 hour cache
          });
        }).catch(() => null); // Fallback to Jakarta coords if rejected

        const lat = position?.coords.latitude || -6.2088;
        const lon = position?.coords.longitude || 106.8456;

        // 2. Get Location Name from BigDataCloud (Reverse Geocode)
        try {
          const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=id`;
          const geoRes = await fetch(geoUrl);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const city = geoData.city || geoData.locality || geoData.principalSubdivision || 'Jakarta';
            if (isMounted) setLocationName(city);
          }
        } catch (e) {
          console.warn('Reverse Geocoding failed:', e);
        }

        // 3. Get Prayer Times & Date from Aladhan
        const timestamp = Math.floor(Date.now() / 1000);
        const aladhanUrl = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lon}&method=11`;
        
        const response = await fetch(aladhanUrl);
        if (!response.ok) throw new Error('Prayer API unreachable');
        
        const data = await response.json();
        
        if (data?.data?.timings && isMounted) {
          setPrayerTimes({
            Fajr: data.data.timings.Fajr,
            Dhuhr: data.data.timings.Dhuhr,
            Asr: data.data.timings.Asr,
            Maghrib: data.data.timings.Maghrib,
            Isha: data.data.timings.Isha
          });

          // Hijri Date from Aladhan
          const h = data.data.date.hijri;
          setHijriDate({
            date: h.date,
            day: h.day,
            month: h.month.en, // Or h.month.ar for Arabic
            year: h.year,
            designation: h.designation.abbreviated
          });

          // Gregorian Date from Aladhan
          const g = data.data.date.gregorian;
          setGregorianDate({
            date: g.date,
            day: g.day,
            month: g.month.en,
            year: g.year
          });

          setError(null);
        }
      } catch (err: any) {
        console.error('[usePrayerTimes] Error:', err);
        if (isMounted) {
          setPrayerTimes(JAKARTA_FALLBACK);
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchLocationAndPrayers();

    return () => {
      isMounted = false;
    };
  }, []);

  return { 
    prayerTimes, 
    hijriDate, 
    gregorianDate,
    locationName,
    isLoading, 
    error 
  };
}
