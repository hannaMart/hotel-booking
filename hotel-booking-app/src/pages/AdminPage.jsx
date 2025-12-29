import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

export default function AdminPage() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // фильтр: active | all
  const [statusFilter, setStatusFilter] = useState("active");

  // загрузка бронирований (только при первом входе)
  async function loadBookings() {
    setError(null);

    try {
      const meRes = await fetch(`${API_URL}/admin/me`, {
        credentials: "include",
      });
      const me = await meRes.json();

      if (!me.isAdmin) {
        navigate("/admin/login");
        return;
      }

      const res = await fetch(`${API_URL}/admin/bookings`, {
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to load bookings");
        return;
      }

      setBookings(data);
    } catch {
      setError("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
    document.getElementById("root")?.classList.add("no-bg");
    return () => document.getElementById("root")?.classList.remove("no-bg");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // отмена бронирования — обновляем только строку
  async function cancelBooking(bookingId) {
    const res = await fetch(`${API_URL}/admin/bookings/${bookingId}/cancel`, {
      method: "PATCH",
      credentials: "include",
    });

    const updated = await res.json();

    if (!res.ok) {
      alert(updated?.error || "Cancel failed");
      return;
    }

    setBookings((prev) =>
      prev.map((b) =>
        b.bookingId === bookingId ? { ...b, status: "cancelled" } : b
      )
    );
  }

  async function completeBooking(bookingId) {
    const res = await fetch(`${API_URL}/admin/bookings/${bookingId}/complete`, {
      method: "PATCH",
      credentials: "include",
    });

    const updated = await res.json();

    if (!res.ok) {
      alert(updated?.error || "Complete failed");
      return;
    }

    setBookings((prev) =>
      prev.map((b) =>
        b.bookingId === bookingId ? { ...b, status: "completed" } : b
      )
    );
  }

  // применяем фильтр
  const visibleBookings =
    statusFilter === "active"
      ? bookings.filter((b) => b.status === "confirmed")
      : bookings;

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="main container mt-4">
      <a
        href="/admin/calendar"
        style={{ display: "inline-block", marginBottom: 12 }}
      >
        Open availability calendar
      </a>

      <h2>Admin — Bookings</h2>

      {/* фильтр */}
      <div className="mb-3">
        <button
          onClick={() => setStatusFilter("active")}
          disabled={statusFilter === "active"}
        >
          Active
        </button>
        <button
          onClick={() => setStatusFilter("all")}
          disabled={statusFilter === "all"}
          style={{ marginLeft: 8 }}
        >
          All
        </button>
      </div>

      <table className="table table-bordered table-sm">
        <thead>
          <tr>
            <th>Booking#</th>
            <th>Date</th>
            <th>Room</th>
            <th>Guest</th>
            <th>Period</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {visibleBookings.map((b) => (
            <tr key={b.bookingId}>
              <td>{b.bookingNumber ?? "—"}</td>
              <td>
                {b.createdAt ? new Date(b.createdAt).toLocaleString() : "—"}
              </td>
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
              <td>{b.status}</td>
              <td>
                {b.status === "confirmed" ? (
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => completeBooking(b.bookingId)}
                    >
                      Complete
                    </button>

                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => cancelBooking(b.bookingId)}
                    >
                      Cancel
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
    </div>
  );
}
