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

export default function Journey() {
  const [ref, inView] = useInView(0.05);
  const { siteContent } = useSiteContent();
  const journey = siteContent.journey;

  return (
    <section
      id="trajetoria"
      ref={ref}
      style={{
        padding: '140px 80px',
        background: '#141414',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: '1px',
          background: 'linear-gradient(to bottom, transparent, rgba(201,169,110,0.12), transparent)',
          pointerEvents: 'none',
        }}
        className="center-line"
      />

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
          {journey.sectionLabel}
        </span>
        <div style={{ width: '80px', height: '1px', background: 'rgba(201,169,110,0.3)' }} />
      </div>

      <h2
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(40px, 5vw, 70px)',
          fontWeight: 300,
          color: '#F5F0E8',
          marginBottom: '100px',
          lineHeight: 1.1,
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s ease 0.2s',
        }}
      >
        {journey.headingPrefix} <em style={{ color: '#C9A96E' }}>{journey.headingAccent}</em>
      </h2>

      <div style={{ position: 'relative', maxWidth: '1100px', margin: '0 auto' }}>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: '1px',
            background: 'linear-gradient(to bottom, rgba(201,169,110,0.5), rgba(201,169,110,0.1))',
            transform: 'translateX(-50%)',
          }}
          className="timeline-line"
        />

        {journey.items.map((item, i) => {
          const isLeft = i % 2 === 0;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: isLeft ? 'flex-start' : 'flex-end',
                marginBottom: '60px',
                position: 'relative',
                opacity: inView ? 1 : 0,
                transform: inView ? 'translateY(0)' : 'translateY(40px)',
                transition: `all 0.8s ease ${0.1 + i * 0.12}s`,
              }}
              className="timeline-item"
            >
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '28px',
                  width: '10px',
                  height: '10px',
                  background: '#C9A96E',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 2,
                  boxShadow: '0 0 16px rgba(201,169,110,0.4)',
                }}
                className="timeline-dot"
              />

              <div
                style={{
                  width: '44%',
                  padding: '32px 36px',
                  background: '#1A1A1A',
                  border: '1px solid rgba(201,169,110,0.12)',
                  marginLeft: isLeft ? 0 : 'auto',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '36px',
                    fontWeight: 300,
                    fontStyle: 'italic',
                    color: '#C9A96E',
                    opacity: 0.5,
                    lineHeight: 1,
                    marginBottom: '12px',
                  }}
                >
                  {item.year}
                </div>
                <h3
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '22px',
                    fontWeight: 400,
                    color: '#F5F0E8',
                    marginBottom: '12px',
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '13px',
                    fontWeight: 300,
                    lineHeight: 1.85,
                    color: 'rgba(245,240,232,0.5)',
                  }}
                >
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .center-line, .timeline-line { left: 24px !important; }
          .timeline-item { justify-content: flex-end !important; }
          .timeline-item > div:last-child { width: calc(100% - 60px) !important; margin-left: 60px !important; }
          .timeline-dot { left: 24px !important; }
          section#trajetoria { padding: 80px 24px !important; }
        }
      `}</style>
    </section>
  );
}
