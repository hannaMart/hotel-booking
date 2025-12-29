import { useNavigate } from "react-router-dom";

export default function RoomCard({ room, nights, checkIn, checkOut, guests }) {
  const navigate = useNavigate();
  const totalPrice = nights * room.pricePerNight;

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
      {/* Image */}
      <img
        src={room.imageUrl}
        className="card-img-top"
        alt={room.title}
        style={{ height: 200, objectFit: "cover" }}
      />

      <div className="card-body d-flex flex-column">
        {/* Title */}
        <h5 className="card-title mb-2">{room.title}</h5>

        {/* Meta */}
        <div className="text-muted small mb-2">{room.bedType}</div>

        {/* Features */}
        <ul className="small mb-3">
          {room.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>

        {/* Price */}
        <div className="mt-auto">
          <div className="fw-bold">
            {room.pricePerNight} PLN{" "}
            <span className="text-muted small">/ night</span>
          </div>

          {nights > 0 && (
            <div className="text-muted small mb-2">
              {totalPrice} PLN total for {nights} night{nights > 1 ? "s" : ""}
            </div>
          )}

          <button
            className="btn btn-primary w-100"
            type="button"
            onClick={handleBookNow}
            disabled={!checkIn || !checkOut || !guests || nights <= 0}
          >
            Book now
          </button>
        </div>
      </div>
    </div>
  );
}
