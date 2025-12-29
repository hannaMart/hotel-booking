import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../config";

export default function AdminPage() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("active");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const rootElement = document.getElementById("root");
    rootElement?.classList.add("no-bg");

    loadBookings();

    return () => {
      rootElement?.classList.remove("no-bg");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadBookings() {
    setError("");
    setIsLoading(true);

    try {
      const meRes = await fetch(`${API_URL}/admin/me`, { credentials: "include" });
      const me = await meRes.json().catch(() => ({}));

      if (!meRes.ok || !me?.isAdmin) {
        navigate("/admin/login");
        return;
      }

      const res = await fetch(`${API_URL}/admin/bookings`, {
        credentials: "include",
      });

      const data = await res.json().catch(() => []);
      if (!res.ok) {
        setError(data?.error || "Nie udało się wczytać rezerwacji.");
        return;
      }

      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Nie udało się wczytać rezerwacji:", err);
      setError("Nie udało się wczytać rezerwacji.");
    } finally {
      setIsLoading(false);
    }
  }

  async function updateBookingStatus(bookingId, action, nextStatus, fallbackMessage) {
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${bookingId}/${action}`, {
        method: "PATCH",
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data?.error || fallbackMessage);
        return;
      }

      setBookings((prev) =>
        prev.map((b) => (b.bookingId === bookingId ? { ...b, status: nextStatus } : b))
      );
    } catch {
      alert(fallbackMessage);
    }
  }

  function cancelBooking(bookingId) {
    return updateBookingStatus(
      bookingId,
      "cancel",
      "cancelled",
      "Nie udało się anulować rezerwacji."
    );
  }

  function completeBooking(bookingId) {
    return updateBookingStatus(
      bookingId,
      "complete",
      "completed",
      "Nie udało się zakończyć rezerwacji."
    );
  }

  const visibleBookings = useMemo(() => {
    if (statusFilter === "active") {
      return bookings.filter((b) => b.status === "confirmed");
    }
    return bookings;
  }, [bookings, statusFilter]);

  if (isLoading) return <p>Wczytywanie…</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="main container mt-4">
      <Link to="/admin/calendar" style={{ display: "inline-block", marginBottom: 12 }}>
        Otwórz kalendarz dostępności
      </Link>

      <h2>Panel admina — rezerwacje</h2>

      <div className="mb-3 d-flex gap-2">
        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          onClick={() => setStatusFilter("active")}
          disabled={statusFilter === "active"}
        >
          Aktywne
        </button>

        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setStatusFilter("all")}
          disabled={statusFilter === "all"}
        >
          Wszystkie
        </button>
      </div>

      <table className="table table-bordered table-sm">
        <thead>
          <tr>
            <th>Nr rezerwacji</th>
            <th>Data utworzenia</th>
            <th>Pokój</th>
            <th>Gość</th>
            <th>Termin</th>
            <th>Suma</th>
            <th>Status</th>
            <th>Akcje</th>
          </tr>
        </thead>

        <tbody>
          {visibleBookings.map((b) => (
            <tr key={b.bookingId}>
              <td>{b.bookingNumber ?? "—"}</td>
              <td>{b.createdAt ? new Date(b.createdAt).toLocaleString("pl-PL") : "—"}</td>
              <td>{b.roomTitle ?? "—"}</td>
              <td>
                {b.guestName ?? "—"}
                <br />
                <small>{b.guestEmail ?? "—"}</small>
              </td>
              <td>
                {b.checkIn ?? "—"} → {b.checkOut ?? "—"}
              </td>
              <td>{b.totalPrice ?? "—"} PLN</td>
              <td>{b.status ?? "—"}</td>
              <td>
                {b.status === "confirmed" ? (
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success"
                      onClick={() => completeBooking(b.bookingId)}
                    >
                      Zakończ
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => cancelBooking(b.bookingId)}
                    >
                      Anuluj
                    </button>
                  </div>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {visibleBookings.length === 0 && (
        <div className="alert alert-info">Brak rezerwacji do wyświetlenia.</div>
      )}
    </div>
  );
}
