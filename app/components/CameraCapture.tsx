'use client';

import { useEffect, useRef, useState } from 'react';

export default function CameraCapture({
  onCapture, onCancel,
}: {
  onCapture: (imgUrl: string, base64: string, mediaType: string) => void;
  onCancel: () => void;
}) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError('Camera not supported in this browser.');
          return;
        }
        const s = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width:  { ideal: 1920 },
            height: { ideal: 1440 },
          },
          audio: false,
        });
        if (cancelled) {
          s.getTracks().forEach(t => t.stop());
          return;
        }
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      } catch (e: any) {
        const msg = e.name === 'NotAllowedError'
          ? 'Camera permission denied. You can use the upload option instead.'
          : e.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : `Camera error: ${e.message || e.name}`;
        setError(msg);
      }
    };
    start();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach(t => t.stop());
      setStream(null);
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const capture = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !ready) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const base64 = dataUrl.split(',')[1];
    onCapture(dataUrl, base64, 'image/jpeg');
  };

  const flip = () => setFacingMode(f => f === 'environment' ? 'user' : 'environment');

  return (
    <div>
      <div className="relative bg-black border-2 border-black overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-center p-6">
            <div>
              <div className="f-display italic text-2xl mb-3 text-white">camera unavailable</div>
              <p className="f-mono text-xs text-white/80 max-w-xs mx-auto">{error}</p>
            </div>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted
                   className="absolute inset-0 w-full h-full object-cover"/>
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="f-mono text-[10px] tracking-widest text-white/80">STARTING CAMERA…</span>
              </div>
            )}
            {/* Crosshair reticle */}
            {ready && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-2 border-white/60"/>
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white/80"/>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white/80"/>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white/80"/>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white/80"/>
              </div>
            )}
          </>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden"/>

      <div className="flex gap-2 mt-3">
        <button onClick={onCancel}
                className="px-4 py-3 f-mono text-xs border-2 border-black bg-white tracking-widest">
          ✕ CANCEL
        </button>
        {!error && (
          <>
            <button onClick={capture}
                    disabled={!ready}
                    className="flex-1 py-3 f-mono text-xs tracking-widest"
                    style={{ background: ready ? '#FFDB00' : '#F5F1E8', border: '2px solid #0A0A0A', opacity: ready ? 1 : 0.5 }}>
              ● CAPTURE
            </button>
            <button onClick={flip}
                    disabled={!ready}
                    className="px-4 py-3 f-mono text-xs border-2 border-black bg-white tracking-widest"
                    aria-label="Flip camera">
              ⇄
            </button>
          </>
        )}
      </div>
    </div>
  );
}
