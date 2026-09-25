import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: correo,
          password: contrasena,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const mensajeError =
          typeof data.mensaje === "string"
            ? data.mensaje
            : typeof data.error === "string"
            ? data.error
            : typeof data.message === "string"
            ? data.message
            : "Error en el servidor al autenticar";

        throw new Error(mensajeError);
      }

      if (data.token) {
        localStorage.setItem("menugo_token", data.token);
      }

      navigate("/mapa-salon");
    } catch (err) {
      setError(err.message || "Error al conectar con el servidor");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f3f4f6",
        margin: 0,
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "#ffffff",
          padding: "32px",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#2563eb",
              margin: "0 0 8px 0",
              fontFamily: "sans-serif",
            }}
          >
            MenúGo
          </h1>
          <p
            style={{
              color: "#6b7280",
              fontSize: "14px",
              margin: 0,
              fontFamily: "sans-serif",
            }}
          >
            Ingresa tus credenciales para acceder
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              color: "#dc2626",
              padding: "10px",
              borderRadius: "6px",
              fontSize: "14px",
              marginBottom: "16px",
              textAlign: "center",
              fontFamily: "sans-serif",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="correo"
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                fontFamily: "sans-serif",
              }}
            >
              Correo electrónico
            </label>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="Ingresa tu correo"
              required
              autoComplete="email"
              style={{
                width: "100%",
                height: "42px",
                padding: "0 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
                outline: "none",
                fontFamily: "sans-serif",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              htmlFor="contrasena"
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                fontFamily: "sans-serif",
              }}
            >
              Contraseña
            </label>
            <input
              id="contrasena"
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
              autoComplete="current-password"
              style={{
                width: "100%",
                height: "42px",
                padding: "0 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
                outline: "none",
                fontFamily: "sans-serif",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            style={{
              width: "100%",
              height: "44px",
              backgroundColor: cargando ? "#93c5fd" : "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: cargando ? "not-allowed" : "pointer",
              fontFamily: "sans-serif",
              boxSizing: "border-box",
            }}
          >
            {cargando ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;