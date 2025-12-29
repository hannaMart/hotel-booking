import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { toYMD } from "../utils/dateYMD";
import { API_URL } from "../config";

export default function BookingPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  if (!state) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning">
          Brakuje danych rezerwacji. Wróć na stronę główną i wybierz termin oraz pokój.
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          Wróć na stronę główną
        </button>
      </div>
    );
  }

  const { room, checkIn, checkOut, guests, nights, total } = state;

  const formattedDates = useMemo(() => {
    const formatDate = (d) => new Date(d).toLocaleDateString("pl-PL");
    return {
      checkIn: formatDate(checkIn),
      checkOut: formatDate(checkOut),
    };
  }, [checkIn, checkOut]);

  const handleConfirm = async () => {
    if (loading) return;

    setError("");
    let navigatingAway = false;

    // Druga linia ochrony (required w przeglądarce też zadziała)
    if (!guestName.trim() || !guestEmail.trim()) {
      setError("Wpisz imię i nazwisko oraz adres e-mail.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          checkIn: toYMD(checkIn),
          checkOut: toYMD(checkOut),
          guests: Number(guests),
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
        }),
      });

      if (res.status === 409) {
        setError("Ten pokój został właśnie zarezerwowany na wybrany termin.");
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.message || "Nie udało się utworzyć rezerwacji.");
        return;
      }

      const booking = await res.json();

      navigatingAway = true;
      navigate(`/confirmation/${booking.bookingId}`, { replace: true });
    } catch {
      setError("Błąd sieci. Spróbuj ponownie.");
    } finally {
      // Nie wyłączamy loading, jeśli odchodzimy ze strony
      if (!navigatingAway) setLoading(false);
    }
  };

  return (
    <div className="booking-page container py-4">
      <h2 className="mb-3">Potwierdź rezerwację</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        <div className="col-md-6">
          <div className="card h-100">
            <img
              src={room.imageUrl}
              className="card-img-top"
              alt={room.title}
              style={{ height: 220, objectFit: "cover" }}
            />

            <div className="card-body d-flex flex-column">
              <h5 className="card-title">{room.title}</h5>
              <div className="text-muted small mb-2">{room.bedType}</div>

              <ul className="small mb-0">
                {room.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card h-100 position-relative">
            {loading && (
              <div className="availability-overlay">
                <div className="spinner" />
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
            >
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">Podsumowanie</h5>

                <div className="mb-2">
                  <div className="text-muted small">Termin</div>
                  <div>
                    {formattedDates.checkIn} → {formattedDates.checkOut}
                  </div>
                </div>

                <div className="mb-2">
                  <div className="text-muted small">Liczba gości</div>
                  <div>{guests}</div>
                </div>

                <div className="mb-2">
                  <div className="text-muted small">Liczba nocy</div>
                  <div>{nights}</div>
                </div>

                <div className="mb-2">
                  <div className="text-muted small">Cena za noc</div>
                  <div>{room.pricePerNight} PLN</div>
                </div>

                <hr />

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="fw-bold">Suma</div>
                  <div className="fw-bold">{total} PLN</div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Imię i nazwisko</label>
                  <input
                    className="form-control"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="np. Anna Martysiuk"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">E-mail</label>
                  <input
                    type="email"
                    className="form-control"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="mt-auto">
                  <button
                    className="btn btn-success w-100"
                    disabled={loading}
                    type="submit"
                  >
                    Potwierdź rezerwację
                  </button>

                  <button
                    className="btn btn-link w-100 mt-2"
                    onClick={() => navigate(-1)}
                    disabled={loading}
                    type="button"
                  >
                    Wróć
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
