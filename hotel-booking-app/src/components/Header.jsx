import { Link } from "react-router-dom";
import logo from "../assets/images/logo.png";

export default function Header() {
  return (
    <nav className="navbar navbar-expand navbar-light bg-light">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <img className="logo" src={logo} alt="Baltic Breeze Hotel" />
          Baltic Breeze Hotel
        </Link>

        {/* <div className="navbar-nav">
          <Link className="nav-link" to="/">
            Home
          </Link>

          <Link className="nav-link" to="/admin">
            Admin
          </Link>
        </div> */}
      </div>
    </nav>
  );
}
