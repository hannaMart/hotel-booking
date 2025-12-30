require("dotenv").config();
const cors = require("cors");
const express = require("express");
const session = require("express-session");
const supabase = require("./supabaseClient");
const { sendBookingConfirmationEmail } = require("./mailer");

const app = express();

const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];

app.use(
  cors({
    origin: (origin, cb) => {
      // Zapytania bez origin (np. Render healthcheck, curl) – pozwalamy
      if (!origin) return cb(null, true);

      // Lokalny frontend (Vite)
      if (allowedOrigins.includes(origin)) return cb(null, true);

      // Tymczasowo: pozwalamy na domeny https (np. Vercel)
      if (origin.startsWith("https://")) return cb(null, true);

      // Inne źródła blokujemy
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

console.log("SESSION_SECRET:", !!process.env.SESSION_SECRET);
console.log("ADMIN_PASSWORD:", !!process.env.ADMIN_PASSWORD);

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  session({
    name: "admin_sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 3, // 3 hours
    },
  })
);

// ---------- Admin auth helpers ----------
function requireAdmin(req, res, next) {
  if (req.session?.isAdmin) return next();
  return res.status(401).json({ error: "Unauthorized" });
}

// ---------- DTO mappers ----------
function formatData(data) {
  return data.map((room) => ({
    id: room.id,
    title: room.title,
    bedType: room.bed_type,
    capacity: room.capacity,
    pricePerNight: room.price_per_night,
    features: room.features,
    imageUrl: room.image_url,
    status: room.status,
  }));
}

function mapBookingRowToDto(row) {
  return {
    bookingId: row.id, // UUID (internal)
    bookingNumber: row.booking_number, // human-friendly
    guestName: row.guest_name,
    guestEmail: row.guest_email,
    roomTitle: row.room_snapshot_title,
    roomImage: row.room_snapshot_image_url,
    checkIn: row.check_in,
    checkOut: row.check_out,
    guests: row.guests,
    totalPrice: row.total_price,
    status: row.status,
    createdAt: row.created_at,
    emailSent: row.email_sent,
    emailSentAt: row.email_sent_at,
  };
}

// ---------- Routes ----------

// Admin login
app.post("/admin/login", (req, res) => {
  const { password } = req.body;

  if (!password) return res.status(400).json({ error: "Password required" });
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid password" });
  }

  req.session.isAdmin = true;
  req.session.save(() => res.json({ ok: true }));
});

// Admin logout
app.post("/admin/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });

    res.clearCookie("admin_sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.json({ ok: true });
  });
});

// Admin session check
app.get("/admin/me", (req, res) => {
  return res.json({ isAdmin: !!req.session?.isAdmin });
});

// Rooms
app.get("/rooms", async (req, res) => {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .order("legacy_id", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  return res.json(formatData(data));
});

// Available rooms
app.get("/available-rooms", async (req, res) => {
  const { checkIn, checkOut, guests } = req.query;

  if (!checkIn || !checkOut || !guests) {
    return res.status(400).json({ message: "Missing required query parameters" });
  }

  try {
    const { data: rooms, error: roomsError } = await supabase
      .from("rooms")
      .select("*")
      .gte("capacity", Number(guests));

    if (roomsError) throw roomsError;

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("room_id")
      .lt("check_in", checkOut)
      .gt("check_out", checkIn)
      .eq("status", "confirmed");

    if (bookingsError) throw bookingsError;

    const bookedRoomIds = bookings.map((b) => b.room_id);
    const availableRooms = rooms.filter((room) => !bookedRoomIds.includes(room.id));

    return res.json(formatData(availableRooms));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch available rooms" });
  }
});

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
    const nights = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24);
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

    // 1st attempt
    let bookingNumber = Math.floor(10000 + Math.random() * 90000);
    ({ data, error } = await supabase
      .from("bookings")
      .insert([makeInsertPayload(bookingNumber)])
      .select()
      .single());

    // 2nd attempt only if booking_number duplicate
    if (error && error.message?.includes("booking_number")) {
      bookingNumber = Math.floor(10000 + Math.random() * 90000);
      ({ data, error } = await supabase
        .from("bookings")
        .insert([makeInsertPayload(bookingNumber)])
        .select()
        .single());
    }

    if (error) throw error;

    // 5) email (does not break booking)
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

    // 6) respond
    return res.status(201).json(mapBookingRowToDto(data));
  } catch (e) {
    console.error("BOOKING ERROR:", e?.message || e);
    return res.status(500).json({ message: "Failed to create booking" });
  }
});

// Get booking by UUID id
app.get("/bookings/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase.from("bookings").select("*").eq("id", id).single();

  if (error || !data) {
    return res.status(404).json({ message: "Booking not found" });
  }

  return res.json(mapBookingRowToDto(data));
});

// Admin bookings list
app.get("/admin/bookings", requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      booking_number,
      created_at,
      room_id,
      check_in,
      check_out,
      guests,
      status,
      guest_name,
      guest_email,
      room_snapshot_title,
      room_snapshot_image_url,
      price_per_night_snapshot,
      total_price,
      email_sent,
      email_sent_at
    `
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });

  return res.json(data.map(mapBookingRowToDto));
});

app.patch("/admin/bookings/:id/cancel", requireAdmin, async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  return res.json(mapBookingRowToDto(data));
});

app.patch("/admin/bookings/:id/complete", requireAdmin, async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "completed" })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  return res.json(mapBookingRowToDto(data));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
