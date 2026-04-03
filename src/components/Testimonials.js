import React, { useState, useEffect, useRef } from 'react';
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

export default function Testimonials() {
  const [ref, inView] = useInView(0.1);
  const [active, setActive] = useState(0);
  const { siteContent } = useSiteContent();
  const testimonials = siteContent.testimonials;

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.items.length]);

  return (
    <section
      id="depoimentos"
      ref={ref}
      style={{
        padding: '140px 80px',
        background: '#0D0D0D',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '60px',
          left: '60px',
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '280px',
          fontWeight: 300,
          color: 'rgba(201,169,110,0.05)',
          lineHeight: 1,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        "
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '80px',
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
          {testimonials.sectionLabel}
        </span>
        <div style={{ width: '80px', height: '1px', background: 'rgba(201,169,110,0.3)' }} />
      </div>

      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
          opacity: inView ? 1 : 0,
          transition: 'all 0.8s ease 0.2s',
        }}
      >
        <div style={{ position: 'relative', minHeight: '260px' }}>
          {testimonials.items.map((t, i) => (
            <div
              key={i}
              style={{
                position: i === 0 ? 'relative' : 'absolute',
                top: 0,
                left: 0,
                right: 0,
                opacity: active === i ? 1 : 0,
                transform: active === i ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                pointerEvents: active === i ? 'auto' : 'none',
              }}
            >
              <div style={{ display: 'flex', gap: '4px', marginBottom: '32px' }}>
                {[...Array(Number(t.stars || 5))].map((_, si) => (
                  <span key={si} style={{ color: '#C9A96E', fontSize: '16px' }}>★</span>
                ))}
              </div>

              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 'clamp(22px, 3vw, 34px)',
                  fontWeight: 300,
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                  color: '#F5F0E8',
                  marginBottom: '40px',
                }}
              >
                "{t.text}"
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '1px',
                    background: '#C9A96E',
                  }}
                />
                <div>
                  <div
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: '14px',
                      fontWeight: 400,
                      color: '#F5F0E8',
                      marginBottom: '4px',
                    }}
                  >
                    {t.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: '12px',
                      fontWeight: 300,
                      letterSpacing: '0.1em',
                      color: '#C9A96E',
                      opacity: 0.7,
                    }}
                  >
                    {t.procedure}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '60px',
          }}
        >
          {testimonials.items.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                width: active === i ? '32px' : '8px',
                height: '2px',
                background: active === i ? '#C9A96E' : 'rgba(201,169,110,0.3)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.4s ease',
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        section#depoimentos { padding: 80px 32px !important; }
        @media (min-width: 769px) {
          section#depoimentos { padding: 140px 80px !important; }
        }
      `}</style>
    </section>
  );
}
