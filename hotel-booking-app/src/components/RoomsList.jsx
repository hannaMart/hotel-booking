import RoomCard from "./RoomCard";

export default function RoomsList({
  rooms,
  nights,
  checkIn,
  checkOut,
  guests,
}) {
  return (
    <div className="mt-4">
      {/* Заголовок списка доступных номеров */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0">Available rooms</h5>
        <span className="badge text-bg-secondary">{rooms.length} rooms</span>
      </div>

      {/* Сетка карточек номеров */}
      <div className="row g-3">
        {rooms.map((room) => (
          <div className="col-12 col-md-6 col-lg-4" key={room.id}>
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
