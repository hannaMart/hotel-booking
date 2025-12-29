import { useEffect, useState } from "react";
import DatePicker from "../components/DatePicker";
import RoomsList from "../components/RoomsList";
import { calculateNights } from "../utils/dateUtils";
import { toYMD } from "../utils/dateYMD";
import { API_URL } from "../config";

export default function HomePage() {
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [guests, setGuests] = useState(null);

  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  const nights = calculateNights(checkIn, checkOut);

  useEffect(() => {
    let cancelled = false;

    if (!checkIn || !checkOut || !guests) {
      setRooms([]);
      setRoomsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const ci = toYMD(checkIn);
    const co = toYMD(checkOut);

    const preloadImage = (url) =>
      new Promise((resolve) => {
        if (!url) return resolve();
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve;
        img.src = url;
      });

    const loadRooms = async () => {
      try {
        setRoomsLoading(true);

        const res = await fetch(
          `${API_URL}/available-rooms?checkIn=${ci}&checkOut=${co}&guests=${guests}`
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        const list = Array.isArray(data) ? data : [];

        // Trzymamy loader, dopóki nie dograją się obrazy
        await Promise.all(list.map((r) => preloadImage(r.imageUrl)));

        if (!cancelled) {
          setRooms(list);
        }
      } catch (err) {
        console.error("Nie udało się pobrać pokoi:", err);
        if (!cancelled) setRooms([]);
      } finally {
        if (!cancelled) setRoomsLoading(false);
      }
    };

    loadRooms();

    return () => {
      cancelled = true;
    };
  }, [checkIn, checkOut, guests]);

  const handleDatesChange = ({ checkIn: nextCheckIn, checkOut: nextCheckOut }) => {
    setCheckIn(nextCheckIn);

    if (
      nextCheckIn &&
      nextCheckOut &&
      nextCheckOut.getTime() <= nextCheckIn.getTime()
    ) {
      setCheckOut(null);
      return;
    }

    setCheckOut(nextCheckOut);
  };

  const isInvalidRange =
    checkIn && checkOut && checkOut.getTime() <= checkIn.getTime();

  return (
    <div className="main">
      <section className="content">
        <h2>Twój nadmorski wypoczynek zaczyna się tutaj</h2>

        <DatePicker
          checkIn={checkIn}
          checkOut={checkOut}
          onChange={handleDatesChange}
          guests={guests}
          onGuestsChange={setGuests}
        />

        <div className="mt-3">
          Wybrane daty:{" "}
          {checkIn ? checkIn.toLocaleDateString("pl-PL") : "—"} →{" "}
          {checkOut ? checkOut.toLocaleDateString("pl-PL") : "—"}
        </div>
      </section>

      {!checkIn || !checkOut ? (
        <div className="alert alert-info mt-4 mb-0">
          Wybierz daty <b>zameldowania</b> i <b>wymeldowania</b>, aby zobaczyć dostępne pokoje.
        </div>
      ) : !guests ? (
        <div className="alert alert-info mt-4 mb-0">
          Wybierz liczbę <b>gości</b>.
        </div>
      ) : isInvalidRange ? (
        <div className="alert alert-danger mt-4 mb-0">
          Data wymeldowania musi być późniejsza niż data zameldowania.
        </div>
      ) : (
        <RoomsList
          rooms={rooms}
          nights={nights}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
        />
      )}

      {roomsLoading && (
        <div className="availability-overlay">
          <div className="spinner" />
        </div>
      )}
    </div>
  );
}
