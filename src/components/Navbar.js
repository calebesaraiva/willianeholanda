import React, { useState, useEffect } from 'react';
import { useSiteContent } from '../content/SiteContentContext';

const styles = {
  nav: (scrolled) => ({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: scrolled ? '16px 60px' : '28px 60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: scrolled ? 'rgba(26, 26, 26, 0.95)' : 'transparent',
    backdropFilter: scrolled ? 'blur(20px)' : 'none',
    borderBottom: scrolled ? '1px solid rgba(201, 169, 110, 0.15)' : 'none',
    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
  }),
  logo: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '22px',
    fontWeight: 400,
    letterSpacing: '0.05em',
    color: '#F5F0E8',
  },
  logoAccent: {
    color: '#C9A96E',
    fontStyle: 'italic',
  },
  links: {
    display: 'flex',
    gap: '40px',
    listStyle: 'none',
    alignItems: 'center',
  },
  link: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '13px',
    fontWeight: 300,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'rgba(245, 240, 232, 0.75)',
    transition: 'color 0.3s ease',
    cursor: 'pointer',
  },
  cta: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '12px',
    fontWeight: 400,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#C9A96E',
    border: '1px solid rgba(201, 169, 110, 0.5)',
    padding: '10px 24px',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  mobileMenu: {
    display: 'none',
    flexDirection: 'column',
    gap: '5px',
    cursor: 'pointer',
    padding: '8px',
  },
  hamburgerLine: {
    width: '24px',
    height: '1px',
    background: '#C9A96E',
    transition: 'all 0.3s ease',
  },
  mobileNav: (open) => ({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(26, 26, 26, 0.98)',
    backdropFilter: 'blur(20px)',
    zIndex: 999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '40px',
    transform: open ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
  }),
  mobileLink: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '36px',
    fontWeight: 300,
    color: '#F5F0E8',
    cursor: 'pointer',
    letterSpacing: '0.05em',
  },
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const { siteContent } = useSiteContent();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navItems = [
    { label: 'Sobre', id: 'sobre' },
    { label: 'Especialidades', id: 'especialidades' },
    { label: 'Trajetória', id: 'trajetoria' },
    { label: 'Depoimentos', id: 'depoimentos' },
  ];

  return (
    <>
      <nav style={styles.nav(scrolled)}>
        <div style={styles.logo}>
          <span style={styles.logoAccent}>{siteContent.navbar.brandAccent} </span>
          {siteContent.navbar.brandName}
        </div>

        <ul style={styles.links} className="desktop-nav">
          {navItems.map((item) => (
            <li key={item.id}>
              <span
                style={{
                  ...styles.link,
                  color: hovered === item.id ? '#C9A96E' : 'rgba(245, 240, 232, 0.75)',
                }}
                onMouseEnter={() => setHovered(item.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => scrollTo(item.id)}
              >
                {item.label}
              </span>
            </li>
          ))}
          <li>
            <button
              style={styles.cta}
              onMouseEnter={(e) => {
                e.target.style.background = '#C9A96E';
                e.target.style.color = '#1A1A1A';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#C9A96E';
              }}
              onClick={() => scrollTo('contato')}
            >
              {siteContent.navbar.ctaLabel}
            </button>
          </li>
        </ul>

        <div
          style={{ ...styles.mobileMenu, display: 'flex' }}
          className="mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <div style={styles.hamburgerLine} />
          <div style={styles.hamburgerLine} />
          <div style={styles.hamburgerLine} />
        </div>
      </nav>

      <div style={styles.mobileNav(mobileOpen)}>
        <div
          style={{ position: 'absolute', top: '28px', right: '30px', cursor: 'pointer', fontSize: '28px', color: '#C9A96E', fontWeight: 200 }}
          onClick={() => setMobileOpen(false)}
        >
          ×
        </div>
        {navItems.map((item) => (
          <span key={item.id} style={styles.mobileLink} onClick={() => scrollTo(item.id)}>
            {item.label}
          </span>
        ))}
        <button
          style={{ ...styles.cta, fontSize: '14px', padding: '14px 36px' }}
          onClick={() => scrollTo('contato')}
        >
          {siteContent.navbar.ctaLabel}
        </button>
      </div>

      <style>{`
        @media (min-width: 769px) {
          .mobile-toggle { display: none !important; }
          .desktop-nav { display: flex !important; }
        }
        @media (max-width: 768px) {
          .mobile-toggle { display: flex !important; }
          .desktop-nav { display: none !important; }
          nav { padding: 20px 24px !important; }
          nav > div:first-child { font-size: 18px !important; }
        }
      `}</style>
    </>
  );
}
