import { useNavigate } from "react-router-dom";

export default function RoomCard({ room, nights, checkIn, checkOut, guests }) {
  const navigate = useNavigate();

  const pricePerNight = Number(room.pricePerNight || 0);
  const totalPrice = nights * pricePerNight;

  const handleBookNow = () => {
    navigate(`/booking/${room.id}`, {
      state: {
        room,
        checkIn,
        checkOut,
        guests,
        nights,
        total: totalPrice,
      },
    });
  };

  return (
    <div className="card h-100">
      <img
        src={room.imageUrl}
        className="card-img-top"
        alt={room.title}
        style={{ height: 200, objectFit: "cover" }}
      />

      <div className="card-body d-flex flex-column">
        <h5 className="card-title mb-2">{room.title}</h5>

        <div className="text-muted small mb-2">{room.bedType}</div>

        <ul className="small mb-3">
          {room.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>

        <div className="mt-auto">
          <div className="fw-bold">
            {pricePerNight} PLN{" "}
            <span className="text-muted small">/ noc</span>
          </div>

          {nights > 0 && (
            <div className="text-muted small mb-2">
              {totalPrice} PLN łącznie za {nights}{" "}
              {nights === 1 ? "noc" : "nocy"}
            </div>
          )}

          <button
            className="btn btn-primary w-100"
            type="button"
            onClick={handleBookNow}
            disabled={!checkIn || !checkOut || !guests || nights <= 0}
          >
            Zarezerwuj
          </button>
        </div>
      </div>
    </div>
  );
}
