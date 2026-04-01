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
  const [locationName, setLocationName] = useState<string>('Memuat...');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshLocation = async (forceManualCity?: string) => {
    try {
      setIsLoading(true);

      // Priority 1: Geolocation (Automatic Detection)
      // Only skip if forceManualCity is provided (user explicitly triggered manual change)
      let position: GeolocationPosition | null = null;
      
      if (!forceManualCity) {
        position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 3600000 
          });
        }).catch((e) => {
          console.log('[usePrayerTimes] Geolocation failed or denied, falling back to manual/cache');
          return null;
        });
      }

      if (position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        // Get Location Name from Coordinates
        try {
          const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=id`;
          const geoRes = await fetch(geoUrl);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const city = geoData.city || geoData.locality || geoData.principalSubdivision || 'Lokasi Terdeteksi';
            setLocationName(city);
          }
        } catch (e) {
          console.warn('Reverse Geocoding failed:', e);
          setLocationName('Lokasi Terdeteksi');
        }

        // Get Prayer Times & Date from coordinates (Aladhan)
        const timestamp = Math.floor(Date.now() / 1000);
        const aladhanUrl = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lon}&method=11`;
        
        const response = await fetch(aladhanUrl);
        if (!response.ok) throw new Error('Prayer API unreachable');
        const data = await response.json();
        
        if (data?.data?.timings) {
          setPrayerTimes({
            Fajr: data.data.timings.Fajr,
            Dhuhr: data.data.timings.Dhuhr,
            Asr: data.data.timings.Asr,
            Maghrib: data.data.timings.Maghrib,
            Isha: data.data.timings.Isha
          });
          const h = data.data.date.hijri;
          setHijriDate({
            date: h.date, day: h.day, month: h.month.en, year: h.year, designation: h.designation.abbreviated
          });
          const g = data.data.date.gregorian;
          setGregorianDate({
            date: g.date, day: g.day, month: g.month.en, year: g.year
          });
          setError(null);
          return; // Success with Geolocation
        }
      }

      // Priority 2: Manual City / Cached City (Fallback)
      const savedCity = forceManualCity || (typeof window !== 'undefined' ? localStorage.getItem('manual_prayer_city') : null);

      if (savedCity) {
        setLocationName(savedCity);
        const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(savedCity)}&country=Indonesia&method=11`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('API unreachable');
        const data = await res.json();
        
        if (data?.data?.timings) {
          setPrayerTimes({
            Fajr: data.data.timings.Fajr,
            Dhuhr: data.data.timings.Dhuhr,
            Asr: data.data.timings.Asr,
            Maghrib: data.data.timings.Maghrib,
            Isha: data.data.timings.Isha
          });
          const h = data.data.date.hijri;
          setHijriDate({
            date: h.date, day: h.day, month: h.month.en, year: h.year, designation: h.designation.abbreviated
          });
          const g = data.data.date.gregorian;
          setGregorianDate({
            date: g.date, day: g.day, month: g.month.en, year: g.year
          });
          setError(null);
          return;
        }
      }

      // Final Priority: Hardcoded Fallback (Jakarta)
      console.log('[usePrayerTimes] All location methods failed, using Jakarta fallback');
      setLocationName('Jakarta (Default)');
      setPrayerTimes(JAKARTA_FALLBACK);
      setError('Gagal mendeteksi lokasi. Menggunakan waktu Jakarta.');
      
    } catch (err: any) {
      console.error('[usePrayerTimes] Error:', err);
      // Don't overwrite state if we already have something, unless it's the first load
      if (!prayerTimes) setPrayerTimes(JAKARTA_FALLBACK);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateManualCity = (city: string | null) => {
    if (typeof window !== 'undefined') {
      if (city) {
        localStorage.setItem('manual_prayer_city', city);
      } else {
        localStorage.removeItem('manual_prayer_city');
      }
      refreshLocation(city || undefined);
    }
  };

  useEffect(() => {
    refreshLocation();
  }, []);

  return { 
    prayerTimes, 
    hijriDate, 
    gregorianDate,
    locationName,
    isLoading, 
    error,
    refreshLocation: () => refreshLocation(),
    updateManualCity
  };
}
