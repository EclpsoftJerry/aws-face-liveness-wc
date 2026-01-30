//import React from "react";

type Props = {
  onStart: () => void;
};

export default function AwsLivenessIntro({ onStart }: Props) {
  return (    
    <div
      style={{
        fontFamily: "Montserrat, sans-serif", border: "1px solid #e5e7eb", borderRadius: 14, padding: 16, background: "#fff",
        maxWidth: 420, margin: "0 auto", lineHeight: 1.7
      }}
    >
    {/* TÍTULO */}
    <h3 style={{ margin: "0 0 6px 0", fontSize: 17, fontWeight: 600, textAlign: "center" }}>
      🧑‍💻 Verificación de vida
    </h3>

    {/* DESCRIPCIÓN */}
    <p style={{ margin: "0 0 10px 0", fontSize: 15, color: "#000000ff" }}>
      Se abrirá una verificación guiada con cámara
      <br />
      <span style={{ fontSize: 12, opacity: 0.8 }}>
        (puede mostrarse en inglés)
      </span>
    </p>

    {/* PASOS CLAVE */}
    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 15 }}>
      <li>▶️ Presiona <b>Start video check</b></li>
      <li>↔️ Acércate hasta completar la barra</li>
      <li>🧍‍♂️ Mantente quieto cuando veas el mensaje <b>Hold still</b></li>
    </ul>

    {/* WARNING */}
    <div style={{
      background: "#fff4e5", border: "1px solid #ffd8a8", borderRadius: 8, padding: 10, fontSize: 12, color: "#8a5b00",
      marginTop: 10, marginBottom: 12, gap: 8, alignItems: "center"}}>
      ⚠️ <strong>Advertencia:</strong> durante la verificación pueden aparecer luces o cambios de color en pantalla.
    </div>

    {/* BOTÓN */}
    <button
      style={{
        marginTop: 14, width: "100%", padding: "12px", borderRadius: 12, background: "#0f766e", color: "#fff", border: "none",
        fontWeight: 600, cursor: "pointer", fontSize: 15, transition: "opacity 0.2s ease"
      }}
      onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
      onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
      onClick={onStart}
    >
      Comenzar verificación
    </button>
  </div>

  );
}
