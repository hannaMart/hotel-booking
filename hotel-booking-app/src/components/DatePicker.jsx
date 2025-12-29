import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function DatePicker({
  checkIn,
  checkOut,
  onChange,
  guests,
  onGuestsChange,
}) {
  const isInvalidRange =
    checkIn && checkOut && checkOut.getTime() <= checkIn.getTime();

  // Ограничения по датам: сегодня .. +6 месяцев
  const today = new Date();
  const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // обрезали время
  const maxDate = new Date(minDate);
  maxDate.setMonth(maxDate.getMonth() + 6);

  // Для check-out: минимум = max(сегодня, checkIn)
  const checkOutMinDate = checkIn && checkIn > minDate ? checkIn : minDate;

  return (
    <div className="card mt-4">
      <div className="card-body">
        <h5 className="card-title">Select dates</h5>

        <div className="row g-3">
          {/* Check-in */}
          <div className="col-md-4">
            <ReactDatePicker
              selected={checkIn}
              onChange={(date) => onChange({ checkIn: date, checkOut })}
              dateFormat="dd-MM-yyyy"
              className="form-control"
              placeholderText="Check-in date"
              minDate={minDate}
              maxDate={maxDate}
            />
          </div>

          {/* Check-out */}
          <div className="col-md-4">
            <ReactDatePicker
              selected={checkOut}
              onChange={(date) => onChange({ checkIn, checkOut: date })}
              dateFormat="dd-MM-yyyy"
              className="form-control"
              placeholderText="Check-out date"
              minDate={checkOutMinDate}
              maxDate={maxDate}
              disabled={!checkIn}
            />
          </div>

          {/* Guests */}
          <div className="col-md-2">
            <select
              className="form-select"
              value={guests ?? ""}
              onChange={(e) =>
                onGuestsChange(
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
              required
            >
              <option value="" disabled>
                Guests
              </option>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Button (если ты её оставляешь) */}
          <div className="col-md-2 d-flex align-items-end">
            <button
              className="btn btn-primary w-100"
              disabled={!checkIn || !checkOut || !guests || isInvalidRange}
              onClick={() => console.log("Search clicked")}
            >
              Search
            </button>
          </div>
        </div>

        {isInvalidRange && (
          <div className="text-danger mt-2">
            Check-out must be after check-in
          </div>
        )}
      </div>
    </div>
  );
}
