import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

import { API_URL } from "../config";
import { toYMD } from "../utils/dateYMD";
import { calculateNights } from "../utils/dateUtils";

export default function CalendarPage() {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [guests, setGuests] = useState(1);

  // wybrany zakres: [ci, co) (co zawsze > ci)
  const [range, setRange] = useState({ ci: null, co: null });

  useEffect(() => {
    loadRooms();
    loadBookings();

    const rootElement = document.getElementById("root");
    rootElement?.classList.add("no-bg");

    return () => {
      rootElement?.classList.remove("no-bg");
    };
  }, []);

  async function loadRooms() {
    try {
      const res = await fetch(`${API_URL}/rooms`);
      const data = await res.json();
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Nie udało się wczytać pokoi:", err);
      setRooms([]);
    }
  }

  async function loadBookings() {
    try {
      const res = await fetch(`${API_URL}/admin/bookings`, {
        credentials: "include",
      });
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Nie udało się wczytać rezerwacji:", err);
      setBookings([]);
    }
  }

  const suitableRooms = useMemo(
    () => rooms.filter((room) => Number(room.capacity) >= guests),
    [rooms, guests]
  );

  const roomIdByTitle = useMemo(() => {
    const map = new Map();
    for (const room of rooms) map.set(room.title, room.id);
    return map;
  }, [rooms]);

  const getBookingRoomId = useCallback(
    (booking) => {
      if (booking.roomId) return booking.roomId;
      if (booking.room_id) return booking.room_id;
      if (booking.roomTitle) return roomIdByTitle.get(booking.roomTitle) || null;
      return null;
    },
    [roomIdByTitle]
  );

  const rangesOverlap = (ci, co, bi, bo) => ci < bo && co > bi;

  const roomIsFreeForRange = useCallback(
    (roomId, ci, co) => {
      for (const booking of bookings) {
        if (booking.status !== "confirmed") continue;

        const bookingRoomId = getBookingRoomId(booking);
        if (!bookingRoomId || bookingRoomId !== roomId) continue;

        if (rangesOverlap(ci, co, booking.checkIn, booking.checkOut)) {
          return false;
        }
      }
      return true;
    },
    [bookings, getBookingRoomId]
  );

  const freeRoomsForSelectedRange = useMemo(() => {
    if (!range.ci || !range.co) return [];
    return suitableRooms.filter((room) =>
      roomIsFreeForRange(room.id, range.ci, range.co)
    );
  }, [suitableRooms, range, roomIsFreeForRange]);

  const nights =
    range.ci && range.co
      ? calculateNights(
          new Date(`${range.ci}T00:00:00`),
          new Date(`${range.co}T00:00:00`)
        )
      : 0;

  const handleDateClick = (info) => {
    const ci = toYMD(info.date);
    const co = toYMD(new Date(info.date.getTime() + 86400000));
    setRange({ ci, co });
  };

  const handleSelect = (info) => {
    const ci = toYMD(info.start);
    const co = toYMD(info.end);
    if (co <= ci) return;
    setRange({ ci, co });
  };

  return (
    <div className="no-bg calendar-page">
      <h1 className="calendar-title">Kalendarz dostępności</h1>

      <div className="availability-legend">
        <div className="legend-item">
          <span className="legend-dot legend-busy" />
          Zajęte (brak wolnych pokoi dla wybranej liczby gości)
        </div>
        <div className="legend-item">
          <span className="legend-dot legend-free" />
          Wolne (co najmniej 1 pokój dostępny)
        </div>
      </div>

      <div className="availability-filters">
        <label className="filters-label" htmlFor="guests">
          Goście:
        </label>

        <select
          id="guests"
          className="filters-select"
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <div className="range-chip">
          Zameldowanie: <strong>{range.ci ?? "—"}</strong> &nbsp;|&nbsp;
          Wymeldowanie: <strong>{range.co ?? "—"}</strong>
          {range.ci && range.co ? (
            <>
              &nbsp;|&nbsp; Nocy: <strong>{nights}</strong>
            </>
          ) : null}
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => setRange({ ci: null, co: null })}
          disabled={!range.ci && !range.co}
        >
          Wyczyść wybór
        </button>
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        selectable
        selectMirror
        unselectAuto
        longPressDelay={150}
        selectLongPressDelay={150}
        select={handleSelect}
        dateClick={handleDateClick}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,dayGridWeek",
        }}
        dayCellClassNames={(arg) => {
          if (!rooms.length) return [];

          const ci = toYMD(arg.date);
          const co = toYMD(new Date(arg.date.getTime() + 86400000));

          const freeCount = suitableRooms.filter((room) =>
            roomIsFreeForRange(room.id, ci, co)
          ).length;

          return freeCount > 0 ? ["day-free"] : ["day-busy"];
        }}
        height="auto"
      />

      {range.ci && range.co && (
        <div className="available-rooms">
          <div className="available-rooms-title">
            Dostępne pokoje dla <strong>{range.ci}</strong> →{" "}
            <strong>{range.co}</strong> (goście={guests}):{" "}
            <strong>{freeRoomsForSelectedRange.length}</strong>
          </div>

          {freeRoomsForSelectedRange.length === 0 ? (
            <div className="available-rooms-empty">Brak dostępnych pokoi.</div>
          ) : (
            <ul className="available-rooms-list">
              {freeRoomsForSelectedRange.map((room) => {
                const pricePerNight = Number(room.pricePerNight || 0);
                const total = nights * pricePerNight;

                return (
                  <li key={room.id} className="available-room-item">
                    <div className="available-room-main">
                      <span className="room-code">{room.legacy_id}</span>
                      <span className="room-title">{room.title}</span>
                    </div>

                    <div className="available-room-sub">
                      {room.bedType} • miejsca: {room.capacity} • {pricePerNight}{" "}
                      PLN / noc
                    </div>

                    <div className="available-room-price">
                      Razem: <strong>{total} PLN</strong> ({nights} nocy)
                    </div>

                    <button
                      className="available-room-btn"
                      type="button"
                      onClick={() =>
                        navigate(`/booking/${room.id}`, {
                          state: {
                            room,
                            checkIn: range.ci,
                            checkOut: range.co,
                            guests,
                            nights,
                            total,
                          },
                        })
                      }
                    >
                      Zarezerwuj ten pokój
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
