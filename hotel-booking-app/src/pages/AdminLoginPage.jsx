import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

export default function AdminLoginPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // wymagane, żeby cookie zostało zapisane
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Nie udało się zalogować.");
        return;
      }

      navigate("/admin");
    } catch {
      setError("Błąd sieci. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="main container" style={{ maxWidth: 420 }}>
      <h2 className="mb-3">Logowanie admina</h2>

      <form onSubmit={handleSubmit} className="card p-3">
        <label className="form-label">Hasło</label>
        <input
          className="form-control"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          disabled={isLoading}
          required
        />

        {error && <div className="text-danger mt-2">{error}</div>}

        <button className="btn btn-primary mt-3" disabled={isLoading} type="submit">
          {isLoading ? "Logowanie…" : "Zaloguj"}
        </button>
      </form>
    </div>
  );
}
