// app/api/webrtc/config/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  // Configuración para WebRTC (STUN servers)
  const config = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
    ],
    iceCandidatePoolSize: 10,
  };

  return NextResponse.json({
    success: true,
    config,
    signalingServer: process.env.SIGNALING_SERVER_URL || "ws://localhost:3001",
  });
}
