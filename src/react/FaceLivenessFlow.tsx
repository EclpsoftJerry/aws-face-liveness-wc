import React, { useEffect, useRef, useState } from "react";
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
  onSuccess,
  onFailed,
  onError,
  onCancel,
}: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [region, setRegion] = useState("us-east-1");
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<LivenessResult | null>(null);
  //const [status, setStatus] = useState<"SUCCESS" | "FAILED" | null>(null);
  // evita doble llamada a fetchResult (React StrictMode / doble render)
  const fetchingRef = useRef(false);

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
          "us-east-1:f5fb88d1-0739-468d-a85a-c080fc36ec68", // Identity Pool ID
          data.region || "us-east-1"
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

  /* =======================
    Consultar resultado
  ======================= */
  const fetchResult = async () => {
    if (!sessionId) return;

    if (fetchingRef.current) return; // ya se está consultando
    fetchingRef.current = true;

    try {
      const res = await fetch(
        `${baseUrl}/api/aws-liveness/result/${sessionId}`,
        { headers }
      );

      if (!res.ok) {
        throw new Error(`Error consultando resultado AWS: ${res.status}`);
      }

      const result: LivenessResult = await res.json();

      setResult(result);
      setFinished(true);

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
  if (finished && result) {
    const isExpired = String(result.status || "").toUpperCase() === "EXPIRED";
    const ok = result.approved === true;
    return (
      <div
        style={{
          padding: 24,
          textAlign: "center",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          maxWidth: 420,
          margin: "40px auto",
          background: "#fff",
        }}
      >
        {ok ? (
          <>
            <div style={{ fontSize: 48 }}>✅</div>
            <h3>Prueba de vida aprobada</h3>
            <p>
              Confianza: {Number(result.confidence ?? 0).toFixed(2)}% <br />
              Umbral: {Number(result.threshold ?? 0).toFixed(2)}%
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 48 }}>❌</div>
            <h3>No superó la prueba de vida</h3>
            <p style={{ marginTop: 8 }}>
              {isExpired
                ? "La sesión expiró. Vuelva a intentarlo."
                : "Intente nuevamente."}
            </p>
            <p style={{ fontSize: 12, opacity: 0.8 }}>
              Confianza: {Number(result.confidence ?? 0).toFixed(2)}% | Umbral:{" "}
              {Number(result.threshold ?? 0).toFixed(2)}%
            </p>
          </>
        )}

        <button
          style={{
            marginTop: 20,
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: "#2563eb",
            color: "#fff",
            cursor: "pointer",
          }}
          onClick={onCancel}
        >
          Cerrar
        </button>
      </div>
    );
  }

  /* =======================
     AWS Face Liveness UI
  ======================= */
  return (
    <div style={{ width: "100%", maxWidth: 420, margin: "0 auto" }}>
      <FaceLivenessDetector
        sessionId={sessionId}
        region={region}
        onAnalysisComplete={fetchResult}
        onUserCancel={onCancel}
        onError={(error) => onError(error)}
      />
    </div>
  );
}
