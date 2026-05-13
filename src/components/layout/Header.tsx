import './Header.css';

export function Header() {
  return (
    <header className="app-header" id="main-header">
      <div className="app-header__inner container">
        <div className="app-header__brand">
          <span className="app-header__mark">*</span>
          <span className="app-header__title">Reclutamiento</span>
        </div>
        <nav className="app-header__nav">
          <span className="app-header__nav-item app-header__nav-item--active">
            Dashboard
          </span>
        </nav>
      </div>
    </header>
  );
}
