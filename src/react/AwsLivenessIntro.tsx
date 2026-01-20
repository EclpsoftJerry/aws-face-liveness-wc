//import React from "react";

type Props = {
  onStart: () => void;
};

export default function AwsLivenessIntro({ onStart }: Props) {
  return (    
      <div
  style={{
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 16,
    background: "#fff",
    maxWidth: 420,
    margin: "0 auto",
  }}
>
  {/* TÍTULO */}
  <h3 style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 600 }}>
    🧑‍💻 Verificación de vida
  </h3>

  {/* DESCRIPCIÓN */}
  <p style={{ margin: "0 0 10px 0", fontSize: 13, color: "#4b5563" }}>
    Se abrirá una verificación guiada con cámara
    <br />
    <span style={{ fontSize: 12, opacity: 0.8 }}>
      (puede mostrarse en inglés)
    </span>
  </p>

  {/* PASOS CLAVE */}
  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, lineHeight: 1.5 }}>
    <li>▶️ Presiona <b>Start video check</b></li>
    <li>↔️ Acércate hasta completar la barra</li>
    <li>🧍‍♂️ Mantente quieto cuando veas <b>Hold still</b></li>
  </ul>

  {/* WARNING */}
  <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
    ⚠ Durante la verificación pueden mostrarse cambios de color en pantalla.
  </div>

  {/* BOTÓN */}
  <button
    style={{
      marginTop: 14,
      width: "100%",
      padding: "12px",
      borderRadius: 10,
      background: "#0f766e",
      color: "#fff",
      border: "none",
      fontWeight: 600,
      cursor: "pointer",
      fontSize: 14,
    }}
    onClick={onStart}
  >
    Comenzar verificación
  </button>
</div>

  );
}
