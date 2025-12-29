import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const { bookingId: bookingIdParam } = useParams();

  const [serverBooking, setServerBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingIdParam) return;

    let isPageActive = true; // true — пока страница открыта и можно обновлять state
    setLoading(true);

    fetch(`http://localhost:4000/bookings/${bookingIdParam}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (isPageActive) setServerBooking(data);
      })
      .catch(() => {
        if (isPageActive) setServerBooking(null);
      })
      .finally(() => {
        if (isPageActive) setLoading(false);
      });

    return () => {
      isPageActive = false; // страница закрылась / компонент убран
    };
  }, [bookingIdParam]);

  const details = useMemo(() => {
    if (!serverBooking) return null;

    // backend теперь отдаёт DTO (camelCase)
    return {
      checkIn: serverBooking.checkIn,
      checkOut: serverBooking.checkOut,
      guests: serverBooking.guests,
      roomTitle: serverBooking.roomTitle,
      roomImage: serverBooking.roomImage,
      guestEmail: serverBooking.guestEmail,
    };
  }, [serverBooking]);

  const formattedDates = useMemo(() => {
    if (!details) return { ci: "—", co: "—" };
    const fmt = (d) => new Date(d).toLocaleDateString("en-GB");
    return { ci: fmt(details.checkIn), co: fmt(details.checkOut) };
  }, [details]);

  return (
    <div className="container py-5" style={{ maxWidth: 720 }}>
      <h2 className="mb-3">
        Booking confirmed <span aria-hidden="true">✅</span>
      </h2>

      <div className="alert alert-success">
        <div className="fw-bold">Confirmation number</div>
        <div className="small">{serverBooking?.bookingNumber ?? "—"}</div>
      </div>

      <div className="card position-relative">
        {loading && (
          <div className="availability-overlay">
            <div className="spinner" />
          </div>
        )}

        <div className="card-body" style={{ minHeight: 220 }}>
          {details ? (
            <>
              {/* ROOM TITLE */}
              <div className="mb-3">
                <div className="text-muted small">Room</div>
                <div className="fw-bold fs-5">{details.roomTitle || "—"}</div>
              </div>

              {/* DATES */}
              <div className="mb-2">
                <div className="text-muted small">Dates</div>
                <div className="fw-semibold">
                  {formattedDates.ci} → {formattedDates.co}
                </div>
              </div>

              {/* GUESTS */}
              <div className="mb-2">
                <div className="text-muted small">Guests</div>
                <div className="fw-semibold">{details.guests}</div>
              </div>

              <hr />

              {/* TOTAL PRICE */}
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="fw-bold">Total price</div>
                <div className="fw-bold">
                  {serverBooking?.totalPrice ?? "—"} PLN
                </div>
              </div>

              <hr />

              {/* EMAIL INFO */}
              <div className="text-muted small">
                A confirmation email will be sent to the address provided during
                booking:
              </div>

              <div className="fw-semibold small">
                {details.guestEmail || "—"}
              </div>

              <div className="text-muted small mt-1">
                To change or cancel your booking, please contact reception.
              </div>

              {/* ACTIONS */}
              <div className="mt-4 d-grid gap-2">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/")}
                >
                  Back to Home
                </button>
                <button
                  className="btn btn-link"
                  onClick={() => navigate("/admin")}
                >
                  Go to Admin
                </button>
              </div>
            </>
          ) : loading ? (
            <div style={{ height: 180 }} />
          ) : (
            <div className="alert alert-warning mb-0">
              Confirmation data is missing or booking was not found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
