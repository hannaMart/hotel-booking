import { Link } from "react-router-dom";

export default function Header() {
  return (
    <nav className="navbar navbar-expand navbar-light bg-light">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <img class="logo" src="../../public/favicon.png" alt="Baltic Breeze Hotel" className="logo" />
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
