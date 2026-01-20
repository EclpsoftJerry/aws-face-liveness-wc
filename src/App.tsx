import { useEffect, useState } from "react";
import FaceLivenessFlow from "./react/FaceLivenessFlow";
import AwsLivenessIntro from "./react/AwsLivenessIntro";

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_DESA
  //console.log("api", API_BASE_URL);

  // LOGIN TEMPORAL (solo para pruebas)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/authenticate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "tester-antispoofing",
            password: "tester-antispoofing",
          }),
        });

        if (!res.ok) throw new Error("Error autenticando");

        const data = await res.json();
        setToken(data.id_token);
      } catch (err) {
        console.error("LOGIN ERROR", err);
      }
    })();
  }, []);

  // leer cédula del query param UNA VEZ
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) {
      console.log("[React] userId desde query param:", id);
      setUserId(id);
    } else {
      console.log("[React] sin userId en query param");
    }
  }, []);

  if (!token) {
    return <div>Autenticando…</div>;
  }

  // 1) Primero instrucciones
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
      //onCancel={() => console.log("CANCEL")}
      onCancel={() => {console.log("CANCEL");
      setShowIntro(true);}}
    />
  );
}

export default App;
