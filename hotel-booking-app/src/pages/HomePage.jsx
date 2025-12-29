import { useEffect, useMemo, useState } from "react";
import DatePicker from "../components/DatePicker";
import RoomsList from "../components/RoomsList";
import { calculateNights } from "../utils/dateUtils";
import { toYMD } from "../utils/dateYMD";

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
      return;
    }

    const ci = toYMD(checkIn);
    const co = toYMD(checkOut);

    setRoomsLoading(true);

    fetch(
      `http://localhost:4000/available-rooms?checkIn=${ci}&checkOut=${co}&guests=${guests}`
    )
      .then((res) => res.json())
      .then(async (data) => {
        // ❗ держим roomsLoading=true пока не догрузятся картинки
        const preload = (url) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve; // чтобы не зависнуть на битой картинке
            img.src = url;
          });

        await Promise.all(data.map((r) => preload(r.imageUrl)));

        if (!cancelled) {
          setRooms(data);
        }
      })
      .catch((err) => console.error("Failed to load rooms:", err))
      .finally(() => {
        if (!cancelled) setRoomsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [checkIn, checkOut, guests]);

  // Обрабатываем изменение дат из DatePicker
  const handleDatesChange = ({ checkIn: ci, checkOut: co }) => {
    setCheckIn(ci);

    // Если дата выезда стала невалидной — сбрасываем её
    if (ci && co && co.getTime() <= ci.getTime()) {
      setCheckOut(null);
      return;
    }

    setCheckOut(co);
  };

  // Проверка некорректного диапазона
  const isInvalidRange =
    checkIn && checkOut && checkOut.getTime() <= checkIn.getTime();

  // Флаг: можно ли показывать список номеров
  const canShowRooms = Boolean(
    checkIn && checkOut && guests && !isInvalidRange
  );

  return (
    <div className="container mt-4">
      <h2>Make your choices</h2>
      <p className="text-muted">
        Select your check-in and check-out dates to see available rooms.
      </p>

      <DatePicker
        checkIn={checkIn}
        checkOut={checkOut}
        onChange={handleDatesChange}
        guests={guests}
        onGuestsChange={setGuests}
      />

      {/* Отображение выбранных дат */}
      <div className="mt-3 text-muted">
        Selected dates: {checkIn ? checkIn.toLocaleDateString("en-GB") : "—"} →{" "}
        {checkOut ? checkOut.toLocaleDateString("en-GB") : "—"}
      </div>

      {/* Условный рендер */}
      {/* Условный рендер */}
      {!checkIn || !checkOut ? (
        <div className="alert alert-info mt-4 mb-0">
          Please select both <b>check-in</b> and <b>check-out</b> dates to view
          available rooms.
        </div>
      ) : !guests ? (
        <div className="alert alert-info mt-4 mb-0">
          Please select number of <b>guests</b>.
        </div>
      ) : isInvalidRange ? (
        <div className="alert alert-danger mt-4 mb-0">
          Check-out date must be after check-in date.
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
