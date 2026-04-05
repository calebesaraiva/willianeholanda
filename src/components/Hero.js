import React, { useEffect, useRef, useState } from 'react';
import { useSiteContent } from '../content/SiteContentContext';

export default function Hero() {
  const [loaded, setLoaded] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const heroRef = useRef(null);
  const { siteContent } = useSiteContent();
  const hero = siteContent.hero;

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleMouse = (e) => {
      if (!heroRef.current || isMobile) return;
      const rect = heroRef.current.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left) / rect.width - 0.5,
        y: (e.clientY - rect.top) / rect.height - 0.5,
      });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [isMobile]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      ref={heroRef}
      style={{
        position: 'relative',
        height: '100vh',
        minHeight: '700px',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: '#0D0D0D',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${hero.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          transform: isMobile ? 'scale(1.02)' : `scale(1.05) translate(${mousePos.x * -12}px, ${mousePos.y * -8}px)`,
          transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          filter: 'brightness(0.25) saturate(0.6)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 18% 24%, rgba(201,169,110,0.18) 0%, transparent 34%), radial-gradient(circle at 82% 18%, rgba(255,255,255,0.08) 0%, transparent 28%), linear-gradient(135deg, rgba(5,5,5,0.72) 0%, rgba(5,5,5,0.28) 45%, rgba(5,5,5,0.78) 100%)',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(7,7,7,0.92) 0%, rgba(7,7,7,0.56) 42%, rgba(7,7,7,0.30) 68%, rgba(7,7,7,0.7) 100%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '12%',
          right: '8%',
          width: '340px',
          height: '340px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,169,110,0.12) 0%, rgba(201,169,110,0.02) 45%, transparent 72%)',
          filter: 'blur(4px)',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 1.6s ease 0.4s',
          pointerEvents: 'none',
        }}
        className="hero-orb"
      />

      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          right: '14%',
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          border: '1px solid rgba(201,169,110,0.14)',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 1.4s ease 0.7s',
          pointerEvents: 'none',
        }}
        className="hero-ring"
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          opacity: 0.4,
          mixBlendMode: 'overlay',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '55%',
          width: '1px',
          height: '100%',
          background: 'linear-gradient(to bottom, transparent, rgba(201,169,110,0.3), transparent)',
          transform: 'rotate(8deg)',
          transformOrigin: 'top center',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '60px',
          top: '20%',
          bottom: '20%',
          width: '1px',
          background: 'linear-gradient(to bottom, transparent, rgba(201,169,110,0.4), transparent)',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 1.5s ease 0.5s',
        }}
      />

      <div
        style={{
        position: 'relative',
        zIndex: 10,
        padding: '0 80px',
        maxWidth: '900px',
        width: '100%',
      }}
        className="hero-content"
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '28px',
            padding: '10px 16px',
            borderRadius: '999px',
            border: '1px solid rgba(201,169,110,0.18)',
            background: 'rgba(14,14,14,0.42)',
            backdropFilter: 'blur(14px)',
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 1s ease 0.25s',
          }}
          className="hero-badge"
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C9A96E', boxShadow: '0 0 20px rgba(201,169,110,0.65)' }} />
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '11px',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'rgba(245,240,232,0.72)',
            }}
          >
            Blefaroplastia • Lipo de Papada • Platismoplastia
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '40px',
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 1s ease 0.2s',
          }}
        >
          <div style={{ width: '40px', height: '1px', background: '#C9A96E' }} />
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '11px',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: '#C9A96E',
              fontWeight: 300,
            }}
          >
            {hero.label}
          </span>
        </div>

        <h1
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '0.2em',
            flexWrap: 'nowrap',
            whiteSpace: 'nowrap',
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(48px, 7.1vw, 110px)',
            fontWeight: 300,
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
            margin: 0,
            marginBottom: '48px',
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(40px)',
            transition: 'all 1.2s ease 0.4s',
          }}
          className="hero-brand-title"
        >
          <span style={{ color: '#F5F0E8' }}>{hero.titlePrimary}</span>
          <span style={{ color: '#C9A96E', fontStyle: 'italic' }}>{hero.titleAccent}</span>
        </h1>

        <p
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'clamp(14px, 1.5vw, 18px)',
            fontWeight: 200,
            letterSpacing: '0.06em',
            color: 'rgba(245, 240, 232, 0.65)',
            maxWidth: '460px',
            lineHeight: 1.8,
            marginBottom: '60px',
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1.2s ease 0.7s',
          }}
        >
          {hero.tagline}
        </p>

        <div
          style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1.2s ease 0.85s',
          }}
        >
          <button
            onClick={() => scrollTo('contato')}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '12px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              fontWeight: 400,
              background: '#C9A96E',
              color: '#1A1A1A',
              border: '1px solid #C9A96E',
              padding: '16px 40px',
              cursor: 'pointer',
              transition: 'all 0.35s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#C9A96E';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#C9A96E';
              e.target.style.color = '#1A1A1A';
            }}
          >
            {hero.primaryCta}
          </button>
          <button
            onClick={() => scrollTo('sobre')}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '12px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              fontWeight: 400,
              background: 'transparent',
              color: 'rgba(245, 240, 232, 0.75)',
              border: '1px solid rgba(245, 240, 232, 0.25)',
              padding: '16px 40px',
              cursor: 'pointer',
              transition: 'all 0.35s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = 'rgba(201, 169, 110, 0.5)';
              e.target.style.color = '#C9A96E';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = 'rgba(245, 240, 232, 0.25)';
              e.target.style.color = 'rgba(245, 240, 232, 0.75)';
            }}
          >
            {hero.secondaryCta}
          </button>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: '80px',
          bottom: '120px',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateX(0)' : 'translateX(40px)',
          transition: 'all 1.2s ease 1s',
          zIndex: 10,
        }}
        className="hero-stats"
      >
        {hero.stats.map((stat, i) => (
          <div key={i} style={{ textAlign: 'right' }}>
            <div
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '44px',
                fontWeight: 300,
                color: '#C9A96E',
                lineHeight: 1,
              }}
            >
              {stat.number}
            </div>
            <div
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '11px',
                fontWeight: 300,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(245, 240, 232, 0.45)',
                marginTop: '6px',
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '80px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          opacity: loaded ? 0.6 : 0,
          transition: 'opacity 1s ease 1.2s',
          cursor: 'pointer',
        }}
        className="hero-scroll"
        onClick={() => scrollTo('sobre')}
      >
        <div
          style={{
            width: '1px',
            height: '50px',
            background: 'linear-gradient(to bottom, #C9A96E, transparent)',
            animation: 'scrollLine 2s ease-in-out infinite',
          }}
        />
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '10px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(245,240,232,0.5)',
            writingMode: 'vertical-rl',
          }}
        >
          Scroll
        </span>
      </div>

      <style>{`
        @keyframes scrollLine {
          0%, 100% { transform: scaleY(1); opacity: 0.6; }
          50% { transform: scaleY(0.5); opacity: 1; }
        }
        @media (max-width: 900px) {
          .hero-stats { display: none !important; }
          .hero-orb, .hero-ring { display: none !important; }
        }
        @media (max-width: 768px) {
          .hero-content { padding: 0 24px !important; max-width: 100% !important; }
          .hero-brand-title {
            font-size: clamp(34px, 11vw, 64px) !important;
            letter-spacing: -0.025em !important;
            gap: 0.16em !important;
          }
          .hero-scroll { display: none !important; }
          .hero-badge { margin-bottom: 22px !important; }
          section { min-height: 620px !important; }
        }
      `}</style>
    </section>
  );
}
