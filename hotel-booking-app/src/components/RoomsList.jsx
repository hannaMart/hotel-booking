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

  <div className="rooms-grid">
    {rooms.map((room) => (
      <RoomCard
        key={room.id}
        room={room}
        nights={nights}
        checkIn={checkIn}
        checkOut={checkOut}
        guests={guests}
      />
    ))}
  </div>
</div>

  );
}
