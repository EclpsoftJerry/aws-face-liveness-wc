import { useEffect, useRef, useState } from "react";
import { FaceLivenessDetector } from "@aws-amplify/ui-react-liveness";
import { configureAmplify } from "../amplify";

/* =======================
   Tipos
======================= */

type CreateSessionResponse = {
  sessionId: string;
  region: string;
};

export type LivenessResult = {
  sessionId: string;
  status: string;      // "CREATED" | "EXPIRED" | "SUCCEEDED"
  liveness: boolean;   // viene del backend (derivado o directo)
  confidence: number;  // nivel de confianza (0-100)
  threshold: number;   // valor mínimo para aprobar
  approved: boolean;   // true si confidence >= threshold
};

type Props = {
  baseUrl: string;
  authToken: string;
  userId?: string | null;
  onSuccess: (result: LivenessResult) => void;
  onFailed: (result: LivenessResult) => void;
  onError: (error: any) => void;
  onCancel: () => void;
};

/* =======================
   Componente
======================= */

export default function FaceLivenessFlow({
  baseUrl,
  authToken,
  userId,
  onSuccess,
  onFailed,
  onError,
  onCancel,
}: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [region, setRegion] = useState("us-east-1");
  const [loading, setLoading] = useState(true);
  const [showStartWarning, setShowStartWarning] = useState(false);
  const hasUserInteractedRef = useRef(false);
  const warnTimerRef = useRef<number | null>(null);
  //const expireTimerRef = useRef<number | null>(null);
  //const [finished, setFinished] = useState(false);
  //const [result, setResult] = useState<LivenessResult | null>(null);
  //const [status, setStatus] = useState<"SUCCESS" | "FAILED" | null>(null);
  // evita doble llamada a fetchResult (React StrictMode / doble render)
  const fetchingRef = useRef(false);
  const sendResultToParent = (result: LivenessResult) => {
    window.parent.postMessage(
      {
        type: "AWS_LIVENESS_RESULT",
        payload: result,
      },
      "*"
    );
  };
  const sendCancelToParent = () => {
    window.parent.postMessage(
      {
        type: "AWS_LIVENESS_CANCEL",
      },
      "*"
    );
  };

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authToken}`,
  };

  /* =======================
    Crear sesión AWS
  ======================= */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${baseUrl}/api/aws-liveness/session`, {
          method: "POST",
          headers,
        });

        if (!res.ok) {
          throw new Error(`Error creando sesión AWS: ${res.status}`);
        }

        const data: CreateSessionResponse = await res.json();

        // Configurar Amplify con Cognito Identity Pool
        configureAmplify(
          "us-east-1:f5fb88d1-0739-468d-a85a-c080fc36ec68" // Identity Pool ID          
        );

        setSessionId(data.sessionId);
        setRegion(data.region || "us-east-1");
      } catch (err) {
        onError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [baseUrl, authToken]);

  /* ========================================
   Watchdog: si no presiona Start video check
  ========================================= */
  useEffect(() => {
    // se activa cuando ya existe sesión y la UI de AWS está visible
    if (loading || !sessionId) return;

    // reset
    hasUserInteractedRef.current = false;
    setShowStartWarning(false);

    // 9s: mostrar aviso
    warnTimerRef.current = window.setTimeout(() => {
      if (!hasUserInteractedRef.current) {
        setShowStartWarning(true);
      }
    }, 9000);
    // 30s: cortar flujo para evitar que AWS expire por inacción
    // expireTimerRef.current = window.setTimeout(() => {
    //   if (!hasUserInteractedRef.current) {
    //     window.parent.postMessage({ type: "AWS_LIVENESS_EXPIRED" }, "*");
    //     onCancel(); // regresa al Intro (según tu App.tsx)
    //   }
    // }, 30000);
    return () => {
      if (warnTimerRef.current) window.clearTimeout(warnTimerRef.current);
      //if (expireTimerRef.current) window.clearTimeout(expireTimerRef.current);
    };
  }, [loading, sessionId, onCancel]);

  /* =======================
    Consultar resultado
  ======================= */
  const fetchResult = async () => {
    if (!sessionId) return;

    if (fetchingRef.current) return; // ya se está consultando
    fetchingRef.current = true;

    try {
      const query = userId ? `?id=${encodeURIComponent(userId)}` : "";
      const res = await fetch(
        //`${baseUrl}/api/aws-liveness/result/${sessionId}`,
        `${baseUrl}/api/aws-liveness/result/${sessionId}${query}`,
        { headers }
      );

      if (!res.ok) {
        throw new Error(`Error consultando resultado AWS: ${res.status}`);
      }

      const result: LivenessResult = await res.json();

      //setResult(result);
      //setFinished(true);

      // ENVIAR A LIT
      sendResultToParent(result);

      if (result.approved === true) {
        onSuccess(result);
      } else {
        onFailed(result);
      }
    } catch (err) {
      onError(err);
    } finally {
      fetchingRef.current = false;
    }
  };

  /* =======================
     Render
  ======================= */

  if (loading) {
    return <div>Inicializando prueba de vida…</div>;
  }

  if (!sessionId) {
    return <div>No se pudo crear la sesión de AWS</div>;
  }

  /* =======================
     Resultado final UI
  ======================= */
  // if (finished && result) {
  //   const isExpired = String(result.status || "").toUpperCase() === "EXPIRED";
  //   const ok = result.approved === true;
  //   return (
  //     <div
  //       style={{
  //         padding: 24,
  //         textAlign: "center",
  //         border: "1px solid #e5e7eb",
  //         borderRadius: 12,
  //         maxWidth: 420,
  //         margin: "40px auto",
  //         background: "#fff",
  //       }}
  //     >
  //       {ok ? (
  //         <>
  //           <div style={{ fontSize: 48 }}>✅</div>
  //           <h3>Prueba de vida aprobada</h3>
  //           <p>
  //             Confianza: {Number(result.confidence ?? 0).toFixed(2)}% <br />
  //             Umbral: {Number(result.threshold ?? 0).toFixed(2)}%
  //           </p>
  //         </>
  //       ) : (
  //         <>
  //           <div style={{ fontSize: 48 }}>❌</div>
  //           <h3>No superó la prueba de vida</h3>
  //           <p style={{ marginTop: 8 }}>
  //             {isExpired
  //               ? "La sesión expiró. Vuelva a intentarlo."
  //               : "Intente nuevamente."}
  //           </p>
  //           <p style={{ fontSize: 12, opacity: 0.8 }}>
  //             Confianza: {Number(result.confidence ?? 0).toFixed(2)}% | Umbral:{" "}
  //             {Number(result.threshold ?? 0).toFixed(2)}%
  //           </p>
  //         </>
  //       )}

  //       <button
  //         style={{
  //           marginTop: 20,
  //           padding: "8px 16px",
  //           borderRadius: 8,
  //           border: "none",
  //           background: "#2563eb",
  //           color: "#fff",
  //           cursor: "pointer",
  //         }}
  //         onClick={onCancel}
  //       >
  //         Cerrar
  //       </button>
  //     </div>
  //   );
  // }

  /* =======================
     AWS Face Liveness UI
  ======================= */
  return (
    <div style={{ width: "100%", maxWidth: 420, margin: "0 auto", position: "relative" }}
    onClickCapture={() => {
      // cualquier click dentro (incluye el botón Start video check)
      hasUserInteractedRef.current = true;
      setShowStartWarning(false);
    }}>
      {showStartWarning && (
      <div
        style={{
          position: "absolute",
          top: 13,
          left: 10,
          right: 10,
          zIndex: 9999,
          background: "#fff3cd",
          border: "1px solid #ffeeba",
          borderRadius: 10,
          padding: 13,
          fontSize: 14,
          color: "#856404",
          textAlign: "center",
        }}
      >
        ⚠️ Para iniciar la verificación presiona <b>Start video check</b>. Si no lo haces, la sesión puede expirar.
      </div>
    )}
      <FaceLivenessDetector
        sessionId={sessionId}
        region={region}
        onAnalysisComplete={fetchResult}
        onUserCancel={() => {
          // AVISAR A LIT QUE EL USUARIO CANCELÓ
          sendCancelToParent();
          onCancel();
        }}
        //onError={(error) => onError(error)}
        onError={(error:any) => {
          console.error("AWS ERROR RAW", error);

           const errorMessage =
            typeof error?.error === "string"
              ? error.error
              : typeof error?.message === "string"
              ? error.message
              : JSON.stringify(error);
            console.warn("[AWS ERROR MESSAGE]", errorMessage);
              
          // TIMEOUT
          if (error?.state === "TIMEOUT") {
            console.warn("[AWS_LIVENESS] TIMEOUT detectado");
            window.parent.postMessage(
              { type: "AWS_LIVENESS_TIMEOUT" },
              "*"
            );
            return;
          }          
          // Sesión expirada (cuando el usuario no hace nada)
          if (
            errorMessage.toLowerCase().includes("liveness session has expired")
          ) {
            console.warn("[AWS_LIVENESS] SESSION EXPIRED");

            window.parent.postMessage(
              { type: "AWS_LIVENESS_EXPIRED" },
              "*"
            );
            return;
          }
          // otros errores
          onError(error);
        }}
      />
    </div>
  );
}
