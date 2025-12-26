import { useEffect, useState } from "react";
import FaceLivenessFlow from "./react/FaceLivenessFlow";

function App() {
  const [token, setToken] = useState<string | null>(null);

  // LOGIN TEMPORAL (solo para pruebas)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:8082/api/authenticate", {
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

  if (!token) {
    return <div>Autenticando…</div>;
  }

  return (
    <FaceLivenessFlow
      baseUrl="http://localhost:8082"
      authToken={token}
      onSuccess={(res) => console.log("SUCCESS", res)}
      onFailed={(res) => console.log("FAILED", res)}
      onError={(err) => console.error("ERROR", err)}
      onCancel={() => console.log("CANCEL")}
    />
  );
}

export default App;
