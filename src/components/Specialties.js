import React, { useEffect, useRef, useState } from 'react';
import { useSiteContent } from '../content/SiteContentContext';

function useInView(threshold = 0.1) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView];
}

export default function Specialties() {
  const [ref, inView] = useInView(0.05);
  const [hovered, setHovered] = useState(null);
  const { siteContent } = useSiteContent();
  const specialties = siteContent.specialties;

  return (
    <section
      id="especialidades"
      ref={ref}
      style={{
        padding: '140px 80px',
        background: '#0D0D0D',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '60px',
          right: '40px',
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(80px, 12vw, 160px)',
          fontWeight: 300,
          color: 'rgba(201,169,110,0.04)',
          lineHeight: 1,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        Cirurgia
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px',
          opacity: inView ? 1 : 0,
          transition: 'all 0.8s ease',
        }}
      >
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
          {specialties.sectionLabel}
        </span>
        <div style={{ width: '80px', height: '1px', background: 'rgba(201,169,110,0.3)' }} />
      </div>

      <h2
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(40px, 5vw, 70px)',
          fontWeight: 300,
          color: '#F5F0E8',
          marginBottom: '80px',
          maxWidth: '600px',
          lineHeight: 1.1,
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s ease 0.2s',
        }}
      >
        {specialties.headingPrefix} <em style={{ color: '#C9A96E' }}>{specialties.headingAccent}</em>
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '2px',
        }}
        className="specialties-grid"
      >
        {specialties.items.map((spec, i) => (
          <div
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              padding: '48px 40px',
              border: '1px solid',
              borderColor: hovered === i ? 'rgba(201,169,110,0.4)' : 'rgba(255,255,255,0.05)',
              background: hovered === i ? 'rgba(201,169,110,0.05)' : 'transparent',
              position: 'relative',
              cursor: 'default',
              transition: 'all 0.4s ease',
              opacity: inView ? 1 : 0,
              transform: inView ? 'translateY(0)' : 'translateY(40px)',
              transitionDelay: `${0.1 * i}s`,
              boxShadow: hovered === i ? '0 18px 40px rgba(0,0,0,0.22)' : 'none',
              animation: hovered === i ? 'specialtyGlow 2.4s ease-in-out infinite' : 'none',
            }}
          >
            <div
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '13px',
                fontStyle: 'italic',
                color: '#C9A96E',
                opacity: 0.6,
                marginBottom: '32px',
                letterSpacing: '0.1em',
              }}
            >
              {spec.number}
            </div>

            <h3
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '26px',
                fontWeight: 400,
                color: hovered === i ? '#C9A96E' : '#F5F0E8',
                marginBottom: '20px',
                lineHeight: 1.2,
                transition: 'color 0.3s ease',
              }}
            >
              {spec.title}
            </h3>

            <div
              style={{
                width: hovered === i ? '40px' : '24px',
                height: '1px',
                background: '#C9A96E',
                marginBottom: '20px',
                transition: 'width 0.4s ease',
              }}
            />

            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '14px',
                fontWeight: 300,
                lineHeight: 1.85,
                color: 'rgba(245,240,232,0.5)',
              }}
            >
              {spec.desc}
            </p>

            <div
              style={{
                position: 'absolute',
                bottom: '-1px',
                right: '-1px',
                width: hovered === i ? '30px' : '0',
                height: '1px',
                background: '#C9A96E',
                transition: 'width 0.4s ease',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-1px',
                right: '-1px',
                width: '1px',
                height: hovered === i ? '30px' : '0',
                background: '#C9A96E',
                transition: 'height 0.4s ease',
              }}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes specialtyGlow {
          0%, 100% { box-shadow: 0 18px 40px rgba(0,0,0,0.22), inset 0 0 0 rgba(201,169,110,0); }
          50% { box-shadow: 0 24px 54px rgba(0,0,0,0.28), inset 0 0 60px rgba(201,169,110,0.04); }
        }
        @media (max-width: 1100px) {
          .specialties-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .specialties-grid { grid-template-columns: 1fr !important; }
          section#especialidades { padding: 80px 24px !important; }
        }
      `}</style>
    </section>
  );
}
