import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { toYMD } from "../utils/dateYMD";

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
          Booking data is missing. Please start from the home page.
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          Back to Home
        </button>
      </div>
    );
  }

  const { room, checkIn, checkOut, guests, nights, total } = state;

  const formattedDates = useMemo(() => {
    const fmt = (d) => new Date(d).toLocaleDateString("en-GB");
    return {
      checkIn: fmt(checkIn),
      checkOut: fmt(checkOut),
    };
  }, [checkIn, checkOut]);

  const handleConfirm = async () => {
    if (loading) return;

    setError("");
    let navigating = false;

    // вторая линия защиты (browser required тоже сработает)
    if (!guestName.trim() || !guestEmail.trim()) {
      setError("Please enter your full name and email.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/bookings", {
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
        setError("Sorry — this room has just been booked for these dates.");
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.message || "Booking failed");
        return;
      }

      const booking = await res.json();

      navigating = true; // <-- ключ
      navigate(`/confirmation/${booking.bookingId}`, { replace: true });
    } catch (e) {
      setError("Network error");
    } finally {
      // <-- НЕ выключаем loading, если уходим со страницы
      if (!navigating) setLoading(false);
    }
  };

  return (
    <div className=" booking-page container py-4">
      <h2 className="mb-3">Confirm your booking</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        {/* LEFT: Room */}
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
                {room.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* RIGHT: Summary */}
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
                <h5 className="card-title">Booking summary</h5>

                <div className="mb-2">
                  <div className="text-muted small">Dates</div>
                  <div>
                    {formattedDates.checkIn} → {formattedDates.checkOut}
                  </div>
                </div>

                <div className="mb-2">
                  <div className="text-muted small">Guests</div>
                  <div>{guests}</div>
                </div>

                <div className="mb-2">
                  <div className="text-muted small">Nights</div>
                  <div>{nights}</div>
                </div>

                <div className="mb-2">
                  <div className="text-muted small">Price per night</div>
                  <div>{room.pricePerNight} PLN</div>
                </div>

                <hr />

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="fw-bold">Total</div>
                  <div className="fw-bold">{total} PLN</div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Full name</label>
                  <input
                    className="form-control"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Anna Martysiuk"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Email</label>
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

                {/* Buttons pinned to bottom */}
                <div className="mt-auto">
                  <button
                    className="btn btn-success w-100"
                    disabled={loading}
                    type="submit"
                  >
                    Confirm booking
                  </button>

                  <button
                    className="btn btn-link w-100 mt-2"
                    onClick={() => navigate(-1)}
                    disabled={loading}
                    type="button"
                  >
                    Back
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
