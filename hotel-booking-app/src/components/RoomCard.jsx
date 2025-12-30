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
    <div className="roomCard">
      <div className="roomCard__imgWrap">
        <img src={room.imageUrl} alt={room.title} />
      </div>

      <div className="roomCard__body">
        <h3 className="roomCard__title">{room.title}</h3>
        <div className="roomCard__meta">{room.bedType}</div>

        <ul className="roomCard__features">
          {room.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>

        <div className="roomCard__footer">
          <div className="roomCard__price">
            <strong>{pricePerNight} PLN</strong> <span>/ noc</span>
          </div>

          {nights > 0 && (
            <div className="roomCard__total">
              {totalPrice} PLN łącznie za {nights}{" "}
              {nights === 1 ? "noc" : "nocy"}
            </div>
          )}

          <button
            className="roomCard__btn"
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
