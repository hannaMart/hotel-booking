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

  const today = new Date();
  const minDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const maxDate = new Date(minDate);
  maxDate.setMonth(maxDate.getMonth() + 6);

  const checkOutMinDate = checkIn && checkIn > minDate ? checkIn : minDate;

  return (
    <div className="form-wrapper card mt-4">
      <div className="card-body">
        <div className=" jcsb row g-3">
          <div className="col-md-4">
            <ReactDatePicker
              selected={checkIn}
              onChange={(date) => onChange({ checkIn: date, checkOut })}
              dateFormat="dd-MM-yyyy"
              className="form-control"
              placeholderText="Zameldowanie"
              minDate={minDate}
              maxDate={maxDate}
            />
          </div>

          <div className="col-md-4">
            <ReactDatePicker
              selected={checkOut}
              onChange={(date) => onChange({ checkIn, checkOut: date })}
              dateFormat="dd-MM-yyyy"
              className="form-control"
              placeholderText="Wymeldowanie"
              minDate={checkOutMinDate}
              maxDate={maxDate}
              disabled={!checkIn}
            />
          </div>

          <div className="col-md-2">
            <select
              id="guests"
              name="guests"
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
                Goście
              </option>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isInvalidRange && (
          <div className="text-danger mt-2">
            Data wymeldowania musi być późniejsza niż data zameldowania.
          </div>
        )}
      </div>
    </div>
  );
}
