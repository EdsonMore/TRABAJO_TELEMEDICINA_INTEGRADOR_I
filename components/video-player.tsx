// components/video-player.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, X, Volume2, VolumeX } from "lucide-react";

interface VideoPlayerProps {
  videoSrc: string;
  thumbnailSrc?: string;
  title?: string;
  description?: string;
  highContrast?: boolean;
}

export function VideoPlayer({
  videoSrc,
  thumbnailSrc,
  title = "Video explicativo",
  description = "Aprende a usar nuestra plataforma",
  highContrast = false,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  };

  const handleClose = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div
      className={`rounded-2xl shadow-2xl border-4 ${
        highContrast
          ? "bg-gray-800 border-yellow-400"
          : "bg-white border-blue-200"
      } overflow-hidden`}
    >
      {!isPlaying ? (
        <div
          className="aspect-video flex items-center justify-center cursor-pointer group relative overflow-hidden"
          onClick={handlePlay}
          role="button"
          aria-label={`Reproducir video: ${title}`}
          tabIndex={0}
          onKeyPress={(e) => e.key === "Enter" && handlePlay()}
        >
          {thumbnailSrc ? (
            <div className="relative w-full h-full">
              <img
                src={thumbnailSrc}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <div className="text-center text-white">
                  <div
                    className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 ${
                      highContrast ? "bg-yellow-400" : "bg-blue-600"
                    }`}
                  >
                    <Play className="w-10 h-10 text-white fill-current" />
                  </div>
                  <p className="font-bold text-2xl mb-3">{title}</p>
                  <p className="text-xl opacity-90">{description}</p>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center ${
                highContrast
                  ? "bg-gray-700"
                  : "bg-gradient-to-br from-blue-100 to-blue-200"
              }`}
            >
              <div className="text-center p-8">
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 ${
                    highContrast ? "bg-yellow-400" : "bg-blue-600"
                  }`}
                >
                  <Play className="w-10 h-10 text-white fill-current" />
                </div>
                <p
                  className={`font-bold text-2xl mb-3 ${
                    highContrast ? "text-yellow-300" : "text-blue-700"
                  }`}
                >
                  {title}
                </p>
                <p
                  className={`text-xl ${
                    highContrast ? "text-yellow-200" : "text-blue-600"
                  }`}
                >
                  {description}
                </p>
                <p
                  className={`text-lg mt-4 ${
                    highContrast ? "text-yellow-300" : "text-blue-700"
                  }`}
                >
                  Presiona aquí para reproducir
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            src={videoSrc}
            controls={false}
            autoPlay
            muted={isMuted}
            loop
            className="w-full h-full object-cover"
            aria-label={`Reproduciendo: ${title}`}
          >
            Tu navegador no soporta el elemento video.
          </video>

          {/* Controles personalizados */}
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
            <Button
              variant="outline"
              size="lg"
              className="text-white border-2 border-white hover:bg-white/20 bg-black/60 backdrop-blur-sm font-bold text-lg py-3 px-4"
              onClick={toggleMute}
              aria-label={isMuted ? "Activar sonido" : "Silenciar"}
            >
              {isMuted ? (
                <VolumeX className="w-6 h-6 mr-2" />
              ) : (
                <Volume2 className="w-6 h-6 mr-2" />
              )}
              {isMuted ? "Sonido Off" : "Sonido On"}
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="text-white border-2 border-white hover:bg-white/20 bg-black/60 backdrop-blur-sm font-bold text-lg py-3 px-4"
              onClick={handleClose}
              aria-label="Cerrar video"
            >
              <X className="w-6 h-6 mr-2" />
              Cerrar Video
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
