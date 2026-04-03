import React, { useEffect, useRef, useState } from 'react';
import { useSiteContent } from '../content/SiteContentContext';

function useInView(threshold = 0.2) {
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

export default function About() {
  const [ref, inView] = useInView(0.1);
  const { siteContent } = useSiteContent();
  const about = siteContent.about;

  return (
    <section
      id="sobre"
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
          top: '-200px',
          right: '-200px',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,169,110,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '80px',
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(20px)',
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
          {about.sectionLabel}
        </span>
        <div style={{ flex: 1, maxWidth: '80px', height: '1px', background: 'rgba(201,169,110,0.3)' }} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '100px',
          alignItems: 'center',
          maxWidth: '1300px',
        }}
        className="about-grid"
      >
        <div
          style={{
            position: 'relative',
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateX(0)' : 'translateX(-40px)',
            transition: 'all 1s ease 0.2s',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              left: '-20px',
              right: '20px',
              bottom: '20px',
              border: '1px solid rgba(201,169,110,0.2)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              aspectRatio: '4/5',
              overflow: 'hidden',
            }}
          >
            <img
              src={about.image}
              alt="Dra. Williane Holanda"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
                filter: 'saturate(0.85)',
                transition: 'transform 0.8s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.03)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '40%',
                background: 'linear-gradient(to top, rgba(20,20,20,0.6), transparent)',
              }}
            />
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: '-30px',
              right: '-10px',
              background: '#1A1A1A',
              border: '1px solid rgba(201,169,110,0.3)',
              padding: '20px 24px',
              zIndex: 2,
            }}
          >
            <div
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '13px',
                fontStyle: 'italic',
                color: '#C9A96E',
                marginBottom: '4px',
              }}
            >
              {about.badgeTitle}
            </div>
            <div
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '11px',
                fontWeight: 300,
                letterSpacing: '0.1em',
                color: 'rgba(245,240,232,0.6)',
              }}
            >
              {about.badgeSubtitle}
            </div>
          </div>
        </div>

        <div
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateX(0)' : 'translateX(40px)',
            transition: 'all 1s ease 0.4s',
          }}
        >
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(40px, 4vw, 62px)',
              fontWeight: 300,
              lineHeight: 1.15,
              color: '#F5F0E8',
              marginBottom: '32px',
            }}
          >
            {about.titlePrefix}{' '}
            <em style={{ color: '#C9A96E', fontStyle: 'italic' }}>{about.titleAccent}</em>
          </h2>

          <div
            style={{
              width: '48px',
              height: '1px',
              background: '#C9A96E',
              marginBottom: '36px',
            }}
          />

          {about.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '15px',
                fontWeight: 300,
                lineHeight: 2,
                color: 'rgba(245,240,232,0.65)',
                marginBottom: index === about.paragraphs.length - 1 ? '48px' : '24px',
              }}
            >
              {paragraph}
            </p>
          ))}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {about.credentials.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  opacity: inView ? 1 : 0,
                  transform: inView ? 'translateX(0)' : 'translateX(20px)',
                  transition: `all 0.6s ease ${0.6 + i * 0.1}s`,
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#C9A96E',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '14px',
                    fontWeight: 300,
                    color: 'rgba(245,240,232,0.7)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .about-grid {
            grid-template-columns: 1fr !important;
            gap: 60px !important;
          }
          section#sobre {
            padding: 80px 32px !important;
          }
        }
      `}</style>
    </section>
  );
}
