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
  const detectorContainerRef = useRef<HTMLDivElement | null>(null);
  const [challengeStarted, setChallengeStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const countdownRef = useRef<number | null>(null);
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

  useEffect(() => {
    const root = detectorContainerRef.current;
    if (!root) return;

    const attachStartListener = () => {
      const buttons = root.querySelectorAll("button");

      buttons.forEach((btn) => {
        const text = btn.innerText?.toLowerCase() || "";

        if (
          text.includes("iniciar verificación") ||
          text.includes("start video check")
        ) {
          btn.onclick = () => {
            hasUserInteractedRef.current = true;
            setShowStartWarning(false);
            setChallengeStarted(true);
            setSecondsLeft(31);
          };
        }
      });
    };

    // esperar que AWS pinte la UI
    const observer = new MutationObserver(() => {
      attachStartListener();
    });

    observer.observe(root, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [sessionId]);

  useEffect(() => {
    if (!challengeStarted) return;

    countdownRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) {
            window.clearInterval(countdownRef.current);
          }

          // cortar flujo
          window.parent.postMessage(
            { type: "AWS_LIVENESS_TIMEOUT" },
            "*"
          );

          onCancel();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        window.clearInterval(countdownRef.current);
      }
    };
  }, [challengeStarted, onCancel]);

  useEffect(() => {
    const root = detectorContainerRef.current;
    if (!root) return;

    // Diccionario robusto con RegExp (case insensitive)
    const dictionary: Array<{ pattern: RegExp; replace: string }> = [
      { pattern: /move closer/i, replace: "Acércate más" },
      { pattern: /move back/i, replace: "Aléjate un poco" },
      { pattern: /hold still/i, replace: "Quédate quieto" },
      { pattern: /center your face/i, replace: "Centra tu rostro" },
      { pattern: /move face in front of camera/i, replace: "Coloca tu rostro frente a la cámara" },
      { pattern: /start video check/i, replace: "Iniciar verificación" },
      { pattern: /photosensitivity warning/i, replace: "Advertencia de fotosensibilidad" },
      {pattern: /this check flashes different colors.*photosensitive\./i,
       replace:"Esta verificación muestra luces intermitentes. Ten precaución."},
    ];    

    const translate = () => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;

      while ((node = walker.nextNode())) {
        const textNode = node as Text;
        const original = textNode.nodeValue ?? "";

        for (const {pattern, replace } of dictionary) {
          if (pattern.test(original) && original !== replace) {
            textNode.nodeValue = original.replace(pattern, replace);
          }
        }
      }
    };

    // 1) traducir una vez al inicio
    translate();

    // 2) observar cambios (AWS va pintando textos dinámicamente)
    const observer = new MutationObserver(() => translate());
    observer.observe(root, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, [sessionId]);

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
      setChallengeStarted(false);
      if (countdownRef.current) {
        window.clearInterval(countdownRef.current);
      }
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
     AWS Face Liveness UI
  ======================= */
  return (
    <div style={{ width: "100%", maxWidth: 420, margin: "0 auto", position: "relative" }}>
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
        ⚠️ Presiona <b>Iniciar verificación</b> para comenzar la prueba. Si no lo haces, la sesión puede expirar.
      </div>
    )}
    {/* ⏳ Contador visual */}
    {challengeStarted && (
      <div
        style={{
          position: "absolute",
          top: 13,
          left: 10,
          right: 10,
          zIndex: 9998,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            // background: "#fff3cd",
            // border: "1px solid #ffeeba",
            background: secondsLeft <= 10 ? "#f8d7da" : "#fff3cd",
            border: secondsLeft <= 10
              ? "2px solid #dc3545"
              : "1px solid #ffeeba",
            borderRadius: 12,
            padding: "12px 16px",
            fontSize: 16,
            // color: "#856404",
            color: secondsLeft <= 10 ? "#dc3545" : "#856404",
            fontWeight:700,
            textAlign: "center",
            minWidth: 300,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >          
          ⏳ Tienes <b>{secondsLeft}</b> segundos para completar la verificación          
        </div>
      </div>
    )}
    <div ref={detectorContainerRef}>
      <FaceLivenessDetector
        sessionId={sessionId}
        region={region}
        onAnalysisComplete={fetchResult}
        onUserCancel={() => {
          setChallengeStarted(false);          
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
            setChallengeStarted(false);
            if (countdownRef.current) {
              window.clearInterval(countdownRef.current);
            }            
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
            setChallengeStarted(false);
            if (countdownRef.current) {
              window.clearInterval(countdownRef.current);
            }
            window.parent.postMessage(
              { type: "AWS_LIVENESS_EXPIRED" },
              "*"
            );
            return;
          }
          // ERROR DE RED / DNS
          const msg = errorMessage.toLowerCase();
          if (
            msg.includes("NetworkError") ||
            msg.includes("ERR_NAME_NOT_RESOLVED") ||
            msg.includes("Failed to fetch")
          ) {
            console.warn("[AWS_LIVENESS] NETWORK ERROR detectado");

            setChallengeStarted(false);

            if (countdownRef.current) {
              window.clearInterval(countdownRef.current);
            }

            window.parent.postMessage(
              { type: "AWS_LIVENESS_NETWORK_ERROR" },
              "*"
            );

            return;
          }
          // otros errores
          onError(error);
        }}
      />
    </div>
    </div>
  );
}
