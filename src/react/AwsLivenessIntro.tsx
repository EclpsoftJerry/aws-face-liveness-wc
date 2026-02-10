//import React from "react";

type Props = {
  onStart: () => void;
};

export default function AwsLivenessIntro({ onStart }: Props) {
  return (    
    <div
      style={{
        fontFamily: "Montserrat, sans-serif", border: "1px solid #e5e7eb", borderRadius: 14, padding: 16, background: "#fff",
        maxWidth: 420, margin: "0 auto", lineHeight: 1.8
      }}
    >
    {/* TÍTULO */}
    <h3 style={{ margin: "0 0 6px 0", fontSize: 17, fontWeight: 600, textAlign: "center" }}>
      🧑‍💻 Verificación de identidad
    </h3>    

    {/* PASOS CLAVE */}
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 15 }}>
      <li>▶️ Pulsa <b>Comenzar verificación</b> para abrir la cámara</li>
      <li>📷 Dentro de la cámara, presiona <b>Iniciar verificación</b></li>
      <li>↔️ Acércate hasta que la barra avance</li>
      <li>🧍‍♂️ Quédate quieto cuando se indique</li>
    </ul>

    {/* WARNING */}
    <div style={{
      background: "#fff4e5", border: "1px solid #ffd8a8", borderRadius: 8, padding: 10, fontSize: 12, color: "#8a5b00",
      marginTop: 10, marginBottom: 12, gap: 8, alignItems: "center"}}>
      ⚠️ <strong>Advertencia:</strong> durante la verificación aparecerán luces y cambios de color en pantalla.
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
