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

  // выбранный диапазон: [ci, co) (co всегда > ci)
  const [range, setRange] = useState({ ci: null, co: null });

  /* -------------------- LOAD -------------------- */

  useEffect(() => {
    loadRooms();
    loadBookings();
    document.getElementById("root")?.classList.add("no-bg");
    return () => document.getElementById("root")?.classList.remove("no-bg");
  }, []);

  async function loadRooms() {
    try {
      const res = await fetch(`${API_URL}/rooms`);
      const data = await res.json();
      setRooms(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("LOAD ROOMS ERROR:", e?.message || e);
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
    } catch (e) {
      console.error("LOAD BOOKINGS ERROR:", e?.message || e);
      setBookings([]);
    }
  }

  /* -------------------- DERIVED -------------------- */

  const suitableRooms = useMemo(() => {
    return rooms.filter((r) => Number(r.capacity) >= guests);
  }, [rooms, guests]);

  // fallback: если booking не содержит roomId, пробуем сопоставить по title
  const roomIdByTitle = useMemo(() => {
    const map = new Map();
    for (const r of rooms) map.set(r.title, r.id);
    return map;
  }, [rooms]);

  function getBookingRoomId(b) {
    if (b.roomId) return b.roomId;
    if (b.room_id) return b.room_id;
    if (b.roomTitle) return roomIdByTitle.get(b.roomTitle) || null;
    return null;
  }

  function rangesOverlap(ci, co, bi, bo) {
    // пересечение [ci,co) и [bi,bo)
    return ci < bo && co > bi;
  }

  const roomIsFreeForRange = useCallback(
    (roomId, ci, co) => {
      for (const b of bookings) {
        if (b.status !== "confirmed") continue;

        const bRoomId = getBookingRoomId(b);
        if (!bRoomId) continue;
        if (bRoomId !== roomId) continue;

        if (rangesOverlap(ci, co, b.checkIn, b.checkOut)) return false;
      }
      return true;
    },
    [bookings, roomIdByTitle]
  );

  const freeRoomsForSelectedRange = useMemo(() => {
    if (!range.ci || !range.co) return [];
    return suitableRooms.filter((room) =>
      roomIsFreeForRange(room.id, range.ci, range.co)
    );
  }, [suitableRooms, range, roomIsFreeForRange]);

  // nights & total for selected range (use your shared util)
  const nights =
    range.ci && range.co
      ? calculateNights(
          new Date(range.ci + "T00:00:00"),
          new Date(range.co + "T00:00:00")
        )
      : 0;

  /* -------------------- CALENDAR INPUT -------------------- */

  // click on a day => 1 night (end > start always)
  function handleDateClick(info) {
    const ci = toYMD(info.date);
    const co = toYMD(new Date(info.date.getTime() + 86400000));
    setRange({ ci, co });
  }

  // drag select => [start, end) (end exclusive, so end > start)
  function handleSelect(info) {
    const ci = toYMD(info.start);
    const co = toYMD(info.end);
    if (co <= ci) return;
    setRange({ ci, co });
  }

  /* -------------------- RENDER -------------------- */

  return (
    <div className="no-bg calendar-page">
      <h1 className="calendar-title">Availability calendar</h1>

      <div className="availability-legend">
        <div className="legend-item">
          <span className="legend-dot legend-busy" />
          Busy (no rooms for selected guests)
        </div>
        <div className="legend-item">
          <span className="legend-dot legend-free" />
          Free (at least 1 room available)
        </div>
      </div>

      <div className="availability-filters">
        <label className="filters-label" htmlFor="guests">
          Guests:
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
          Check-in: <strong>{range.ci ?? "—"}</strong> &nbsp;|&nbsp; Check-out:{" "}
          <strong>{range.co ?? "—"}</strong>
          {range.ci && range.co ? (
            <>
              &nbsp;|&nbsp; Nights: <strong>{nights}</strong>
            </>
          ) : null}
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => setRange({ ci: null, co: null })}
          disabled={!range.ci && !range.co}
        >
          Clear selection
        </button>
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        selectable={true}
        selectMirror={true}
        unselectAuto={true}
        longPressDelay={150}
        selectLongPressDelay={150}
        select={handleSelect}
        dateClick={handleDateClick}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,dayGridWeek",
        }}
        // Подсветка по Guests: проверяем доступность на 1 ночь (этот день)
        dayCellClassNames={(arg) => {
          if (!rooms.length) return [];

          const ci = toYMD(arg.date);
          const co = toYMD(new Date(arg.date.getTime() + 86400000)); // +1 night

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
            Available rooms for <strong>{range.ci}</strong> →{" "}
            <strong>{range.co}</strong> (guests={guests}):{" "}
            <strong>{freeRoomsForSelectedRange.length}</strong>
          </div>

          {freeRoomsForSelectedRange.length === 0 ? (
            <div className="available-rooms-empty">No rooms available.</div>
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
                      <div className="available-room-sub">
                        {room.bedType} • capacity {room.capacity} •{" "}
                        {pricePerNight} PLN/night
                      </div>
                    </div>

                    <div className="available-room-price">
                      Total: <strong>{total} PLN</strong> ({nights} nights)
                    </div>

                    <button
                      className="available-room-btn"
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
                      Book this room
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
