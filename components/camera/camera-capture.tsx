'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, MapPin, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { reverseGeocode } from '@/lib/supabase/helpers';

interface CameraCaptureProps {
  onCapture: (data: {
    photoUrl: string;
    latitude: number;
    longitude: number;
    address: string;
    city: string;
  }) => void;
  label?: string;
}

export function CameraCapture({ onCapture, label = 'Ambil Foto' }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string; city: string } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setReady(false);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Browser tidak mendukung kamera');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setReady(true);
    } catch (e: any) {
      setError(
        e?.name === 'NotAllowedError'
          ? 'Akses kamera ditolak. Izinkan kamera di pengaturan browser.'
          : e?.message ?? 'Gagal mengakses kamera',
      );
    }
  }, []);

  const getLocation = useCallback(async () => {
    setLocating(true);
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError('Browser tidak mendukung GPS');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const { address, city } = await reverseGeocode(latitude, longitude);
        setLocation({ lat: latitude, lng: longitude, address, city });
        setLocating(false);
      },
      (err) => {
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? 'Akses lokasi ditolak. Izinkan lokasi untuk absen.'
            : 'Gagal mendapatkan lokasi',
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, []);

  useEffect(() => {
    startCamera();
    getLocation();
    return () => stopCamera();
  }, [startCamera, getLocation, stopCamera]);

  const takePhoto = () => {
    if (!videoRef.current || !ready) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPhoto(dataUrl);
    stopCamera();
  };

  const retake = () => {
    setPhoto(null);
    startCamera();
  };

  const confirm = () => {
    if (!photo || !location) return;
    onCapture({
      photoUrl: photo,
      latitude: location.lat,
      longitude: location.lng,
      address: location.address,
      city: location.city,
    });
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-video w-full max-w-md mx-auto rounded-2xl overflow-hidden bg-black border border-border/60">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="Foto" className="w-full h-full object-cover" />
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            {!ready && !error && (
              <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Menyalakan kamera...
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white/90">
                <AlertCircle className="w-8 h-8 mb-2 text-destructive" />
                <p className="text-sm">{error}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={startCamera}>
                  Coba lagi
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* GPS status */}
      <div className="rounded-xl border border-border/60 bg-card/50 p-4">
        <div className="flex items-start gap-3">
          {locating ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin mt-0.5" />
          ) : location ? (
            <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
          ) : (
            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Lokasi GPS</p>
            {locating ? (
              <p className="text-xs text-muted-foreground">Mengambil lokasi...</p>
            ) : locError ? (
              <p className="text-xs text-destructive">{locError}</p>
            ) : location ? (
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p className="truncate">{location.address || 'Lokasi ditemukan'}</p>
                <p>
                  {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  {location.city ? ` — ${location.city}` : ''}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Menunggu GPS...</p>
            )}
          </div>
          {!locating && !location && (
            <Button variant="ghost" size="sm" onClick={getLocation}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Coba lagi
            </Button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        {photo ? (
          <>
            <Button variant="outline" className="flex-1" onClick={retake}>
              <RefreshCw className="w-4 h-4 mr-2" /> Ambil Ulang
            </Button>
            <Button
              className="flex-1 gradient-orange text-white border-0"
              onClick={confirm}
              disabled={!location}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Konfirmasi
            </Button>
          </>
        ) : (
          <Button
            className="flex-1 gradient-orange text-white border-0"
            onClick={takePhoto}
            disabled={!ready}
          >
            <Camera className="w-4 h-4 mr-2" /> {label}
          </Button>
        )}
      </div>
      {!location && !locating && !locError && (
        <p className="text-xs text-center text-muted-foreground">
          Aktifkan GPS dan izinkan akses lokasi untuk melanjutkan.
        </p>
      )}
    </div>
  );
}
