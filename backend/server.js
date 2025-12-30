// Create booking
app.post("/bookings", async (req, res) => {
  const { roomId, checkIn, checkOut, guests, guestName, guestEmail } = req.body;

  if (!roomId || !checkIn || !checkOut || !guests) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (new Date(checkOut) <= new Date(checkIn)) {
    return res.status(400).json({ message: "Invalid date range" });
  }

  try {
    // 1) conflict check
    const { data: conflicts, error: conflictsError } = await supabase
      .from("bookings")
      .select("id")
      .eq("room_id", roomId)
      .eq("status", "confirmed")
      .lt("check_in", checkOut)
      .gt("check_out", checkIn);

    if (conflictsError) throw conflictsError;

    if (conflicts?.length) {
      return res.status(409).json({ message: "Room is already booked" });
    }

    // 2) room snapshot
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("title, price_per_night, image_url")
      .eq("id", roomId)
      .single();

    if (roomError) throw roomError;
    if (!room) return res.status(404).json({ message: "Room not found" });

    // 3) price
    const nights =
      (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24);
    const totalPrice = nights * room.price_per_night;

    // 4) insert payload
    const makeInsertPayload = (bookingNumber) => ({
      booking_number: bookingNumber,
      room_id: roomId,
      check_in: checkIn,
      check_out: checkOut,
      guests: Number(guests),
      guest_name: guestName ? guestName.trim() : null,
      guest_email: guestEmail ? guestEmail.trim() : null,
      room_snapshot_title: room.title,
      room_snapshot_image_url: room.image_url,
      price_per_night_snapshot: room.price_per_night,
      total_price: totalPrice,
    });

    let data, error;

    // 1 попытка
    let bookingNumber = Math.floor(10000 + Math.random() * 90000);
    ({ data, error } = await supabase
      .from("bookings")
      .insert([makeInsertPayload(bookingNumber)])
      .select()
      .single());

    // 2 попытка только при дубле номера
    if (error && error.message?.includes("booking_number")) {
      bookingNumber = Math.floor(10000 + Math.random() * 90000);
      ({ data, error } = await supabase
        .from("bookings")
        .insert([makeInsertPayload(bookingNumber)])
        .select()
        .single());
    }

    if (error) throw error;

    // 5) email (не ломает бронь)
    if (data.guest_email && !data.email_sent) {
      sendBookingConfirmationEmail({
        to: data.guest_email,
        booking: {
          bookingId: data.id,
          bookingNumber: data.booking_number,
          guestName: data.guest_name,
          roomTitle: data.room_snapshot_title,
          checkIn: data.check_in,
          checkOut: data.check_out,
          totalPrice: data.total_price,
        },
      })
        .then(() => {
          return supabase
            .from("bookings")
            .update({
              email_sent: true,
              email_sent_at: new Date().toISOString(),
            })
            .eq("id", data.id);
        })
        .catch((e) => {
          console.error("EMAIL ERROR:", e?.message || e);
        });
    }

    // 6) ответ клиенту
    return res.status(201).json(mapBookingRowToDto(data));
  } catch (e) {
    console.error("BOOKING ERROR:", e?.message || e);
    return res.status(500).json({ message: "Failed to create booking" });
  }
});
