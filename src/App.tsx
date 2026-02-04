import { useEffect, useState } from "react";
import FaceLivenessFlow from "./react/FaceLivenessFlow";
import AwsLivenessIntro from "./react/AwsLivenessIntro";

type InitPayload = { type: "INIT_LIVENESS"; id?: string; token?: string };

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  // (1) ORIGIN permitido del padre (Lit). Ideal: variable de entorno.
  const PARENT_ORIGIN = import.meta.env.VITE_PARENT_ORIGIN || "";

  // (2) Avisar al padre que React ya está listo (handshake)
  useEffect(() => {
    window.parent?.postMessage({ type: "WC_READY" }, "*");
  }, []);

  // (3) Escuchar INIT desde el padre
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // Seguridad: validar origen si lo tienes definido
      if (PARENT_ORIGIN && event.origin !== PARENT_ORIGIN) return;

      const data = event.data as InitPayload;
      console.log("INIT recibido:", data);
      console.log("token recibido", data.token);
      console.log("cedula recibido", data.id);
      if (data?.type !== "INIT_LIVENESS") return;

      if (!data.token) {
        setInitError("No se recibió token para iniciar la verificación.");
        return;
      }
      setToken(data.token);
      setUserId(data.id ?? null);
      setInitError(null);
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [PARENT_ORIGIN]);

  // (4) Timeout si nunca llega INIT
  useEffect(() => {
    const t = setTimeout(() => {
      if (!token) setInitError("No se pudo inicializar la verificación. Intenta nuevamente.");
    }, 8000);
    return () => clearTimeout(t);
  }, [token]);

  // UI de error
  if (initError) {
    return (
      <div style={{ padding: 16 }}>
        <h3>No se pudo iniciar</h3>
        <p>{initError}</p>
      </div>
    );
  }

  // Mientras esperamos INIT
  if (!token) {
    return <div>Conectando…</div>;
  }

  // 1) Intro
  if (showIntro) {
    return <AwsLivenessIntro onStart={() => setShowIntro(false)} />;
  }
  
  // 2) Luego AWS Face Liveness
  return (
    <FaceLivenessFlow      
      baseUrl={API_BASE_URL}
      authToken={token}
      userId={userId}
      onSuccess={(res) => console.log("SUCCESS", res)}
      onFailed={(res) => console.log("FAILED", res)}
      onError={(err) => console.error("ERROR", err)}      
      onCancel={() => {console.log("CANCEL");
      setShowIntro(true);}}
    />
  );
}

export default App;
