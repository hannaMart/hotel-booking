import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import CalendarPage from "./pages/CalendarPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import Header from "./components/Header";
import BookingPage from "./pages/BookingPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import ScrollToTop from "./components/ScrollToTop";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
    <ScrollToTop />
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/booking/:roomId" element={<BookingPage />} />
        <Route path="/confirmation/:bookingId" element={<ConfirmationPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/calendar" element={<CalendarPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
