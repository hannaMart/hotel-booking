import RoomCard from "./RoomCard";

export default function RoomsList({ rooms, nights, checkIn, checkOut, guests }) {
  return (
    <div className="mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0">Dostępne pokoje</h5>
        <span className="badge text-bg-secondary">
          {rooms.length} {rooms.length === 1 ? "pokój" : "pokoje"}
        </span>
      </div>

      <div className="row g-3">
        {rooms.map((room) => (
          <div className={`col-12 col-md-6 ${rooms.length === 1 ? "col-lg-10 mx-auto" : "col-lg-4"}`} key={room.id}>
            <RoomCard
              room={room}
              nights={nights}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
