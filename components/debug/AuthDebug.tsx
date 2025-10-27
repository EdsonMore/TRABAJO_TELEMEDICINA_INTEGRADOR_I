// components/debug/AuthDebug.tsx
import { useState, useEffect } from "react";

export default function AuthDebug() {
  const [authState, setAuthState] = useState<any>({});

  useEffect(() => {
    const checkAuth = () => {
      const tokenLocal = localStorage.getItem("token");
      const tokenSession = sessionStorage.getItem("token");
      const cookies = document.cookie;

      setAuthState({
        localStorage: tokenLocal
          ? `✅ (${tokenLocal.length} chars)`
          : "❌ No encontrado",
        sessionStorage: tokenSession
          ? `✅ (${tokenSession.length} chars)`
          : "❌ No encontrado",
        cookies: cookies || "❌ No cookies",
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
    };

    checkAuth();
    const interval = setInterval(checkAuth, 2000);
    return () => clearInterval(interval);
  }, []);

  const forceLogin = () => {
    // Redirigir al login
    window.location.href = "/login";
  };

  const clearAndReload = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <div className="p-4 border border-red-300 bg-red-50 rounded-lg mb-4">
      <h3 className="font-bold text-red-800 mb-2">🔍 Debug de Autenticación</h3>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <strong>LocalStorage:</strong> {authState.localStorage}
        </div>
        <div>
          <strong>SessionStorage:</strong> {authState.sessionStorage}
        </div>
        <div>
          <strong>Cookies:</strong> {authState.cookies}
        </div>
        <div>
          <strong>Hora:</strong> {authState.timestamp}
        </div>
      </div>

      <div className="flex space-x-2 mt-3">
        <button
          onClick={forceLogin}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
        >
          Ir al Login
        </button>
        <button
          onClick={clearAndReload}
          className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
        >
          Limpiar & Recargar
        </button>
        <button
          onClick={() => console.log("Auth State:", authState)}
          className="bg-green-500 text-white px-3 py-1 rounded text-sm"
        >
          Log Console
        </button>
      </div>
    </div>
  );
}
