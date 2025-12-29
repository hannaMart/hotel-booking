import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../config";

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const { bookingId: bookingIdParam } = useParams();

  const [serverBooking, setServerBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingIdParam) return;

    let isPageActive = true;
    setLoading(true);

    fetch(`${API_URL}/bookings/${bookingIdParam}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
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
      isPageActive = false;
    };
  }, [bookingIdParam]);

  useEffect(() => {
    const rootElement = document.getElementById("root");
    rootElement?.classList.add("no-bg");

    return () => {
      rootElement?.classList.remove("no-bg");
    };
  });

  const details = useMemo(() => {
    if (!serverBooking) return null;

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
    const formatDate = (d) => new Date(d).toLocaleDateString("pl-PL");
    return {
      ci: formatDate(details.checkIn),
      co: formatDate(details.checkOut),
    };
  }, [details]);

  return (
    <div className="container py-5" style={{ maxWidth: 720 }}>
      <h2 className="mb-3">
        Rezerwacja potwierdzona
      </h2>

      <div className="alert alert-success">
        <div className="fw-bold">Numer potwierdzenia</div>
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
              <div className="mb-3">
                <div className="text-muted small">Pokój</div>
                <div className="fw-bold fs-5">{details.roomTitle || "—"}</div>
              </div>

              <div className="mb-2">
                <div className="text-muted small">Termin</div>
                <div className="fw-semibold">
                  {formattedDates.ci} → {formattedDates.co}
                </div>
              </div>

              <div className="mb-2">
                <div className="text-muted small">Liczba gości</div>
                <div className="fw-semibold">{details.guests}</div>
              </div>

              <hr />

              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="fw-bold">Łączna cena</div>
                <div className="fw-bold">
                  {serverBooking?.totalPrice ?? "—"} PLN
                </div>
              </div>

              <hr />

              <div className="text-muted small">
                Potwierdzenie rezerwacji zostanie wysłane na adres e-mail podany
                podczas rezerwacji:
              </div>

              <div className="fw-semibold small">
                {details.guestEmail || "—"}
              </div>

              <div className="text-muted small mt-1">
                Aby zmienić lub anulować rezerwację, skontaktuj się z recepcją.
              </div>

              <div className="mt-4 d-grid gap-2">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/")}
                >
                  Wróć na stronę główną
                </button>
                {/* <button className="btn btn-link" onClick={() => navigate("/admin")}>
                  Przejdź do panelu admina
                </button> */}
              </div>
            </>
          ) : loading ? (
            <div style={{ height: 180 }} />
          ) : (
            <div className="alert alert-warning mb-0">
              Brak danych potwierdzenia albo nie znaleziono rezerwacji.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
