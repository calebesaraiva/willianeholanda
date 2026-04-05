import React, { useRef, useEffect, useState } from 'react';
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

export default function Gallery() {
  const [ref, inView] = useInView(0.05);
  const [hovered, setHovered] = useState(null);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(null);
  const { siteContent } = useSiteContent();
  const gallery = siteContent.gallery;

  useEffect(() => {
    if (activeIndex === null) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveIndex(null);
      }
      if (event.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev + 1) % gallery.items.length);
      }
      if (event.key === 'ArrowLeft') {
        setActiveIndex((prev) => (prev - 1 + gallery.items.length) % gallery.items.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeIndex, gallery.items.length]);

  return (
    <section
      ref={ref}
      className="gallery-section"
      style={{
        padding: '140px 80px',
        background: '#141414',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '60px',
          opacity: inView ? 1 : 0,
          transition: 'all 0.8s ease',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px',
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
              {gallery.sectionLabel}
            </span>
            <div style={{ width: '80px', height: '1px', background: 'rgba(201,169,110,0.3)' }} />
          </div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(36px, 4vw, 56px)',
              fontWeight: 300,
              color: '#F5F0E8',
              lineHeight: 1.1,
            }}
          >
            {gallery.headingPrefix} <em style={{ color: '#C9A96E' }}>{gallery.headingAccent}</em>
          </h2>
          <p
            style={{
              marginTop: '18px',
              maxWidth: '420px',
              color: 'rgba(245,240,232,0.58)',
              lineHeight: 1.8,
            }}
          >
            Uma sele??o visual pensada para transmitir presen?a profissional, delicadeza e autoridade.
          </p>
        </div>
        <a
          href={siteContent.global.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '12px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#C9A96E',
            border: '1px solid rgba(201,169,110,0.3)',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(201,169,110,0.08)';
            e.currentTarget.style.borderColor = '#C9A96E';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(201,169,110,0.3)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
          </svg>
          {gallery.buttonLabel}
        </a>
      </div>

      <div style={{ marginBottom: '16px', color: 'rgba(245,240,232,0.5)', fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        Destaque atual: {gallery.items[featuredIndex]?.caption}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'auto auto',
          gap: '12px',
        }}
        className="gallery-grid"
      >
        {gallery.items.map((img, i) => (
          <div
            key={i}
            onMouseEnter={() => {
              setHovered(i);
              setFeaturedIndex(i);
            }}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setActiveIndex(i)}
            style={{
              position: 'relative',
              aspectRatio: i === 0 ? '1.8/1' : '1/1',
              gridColumn: i === 0 ? 'span 2' : 'span 1',
              overflow: 'hidden',
              cursor: 'pointer',
              opacity: inView ? 1 : 0,
              transform: inView ? 'scale(1)' : 'scale(0.97)',
              transition: `all 0.8s ease ${i * 0.08}s`,
              boxShadow: featuredIndex === i ? '0 24px 60px rgba(0,0,0,0.24)' : 'none',
            }}
          >
            <img
              src={img.src}
              alt={img.alt}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: i === 0 ? 'center 20%' : 'center',
                filter: `saturate(0.82) brightness(${hovered === i ? 0.65 : 0.85})`,
                transform: hovered === i ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(10,10,10,0.85) 0%, transparent 60%)',
                opacity: hovered === i || featuredIndex === i ? 1 : 0.55,
                transition: 'opacity 0.4s ease',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '24px',
              }}
            >
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '16px',
                  fontStyle: 'italic',
                  color: '#F5F0E8',
                  letterSpacing: '0.04em',
                }}
              >
                {img.caption}
              </span>
            </div>

            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: hovered === i ? '30px' : '0',
                height: '2px',
                background: '#C9A96E',
                transition: 'width 0.4s ease',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '2px',
                height: hovered === i ? '30px' : '0',
                background: '#C9A96E',
                transition: 'height 0.4s ease',
              }}
            />
          </div>
        ))}
      </div>

      {activeIndex !== null ? (
        <div
          onClick={() => setActiveIndex(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            background: 'rgba(5,5,5,0.88)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '1100px',
              display: 'grid',
              gap: '18px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ color: 'rgba(245,240,232,0.65)', fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                Galeria Editorial
              </div>
              <button
                type="button"
                onClick={() => setActiveIndex(null)}
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.14)',
                  color: '#F5F0E8',
                  fontSize: '18px',
                  background: 'rgba(255,255,255,0.03)',
                }}
              >
                Ã—
              </button>
            </div>

            <div
              style={{
                position: 'relative',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '28px',
                overflow: 'hidden',
                boxShadow: '0 28px 80px rgba(0,0,0,0.34)',
              }}
            >
              <img
                src={gallery.items[activeIndex].src}
                alt={gallery.items[activeIndex].alt}
                style={{
                  width: '100%',
                  maxHeight: '72vh',
                  objectFit: 'cover',
                }}
              />

              <button
                type="button"
                onClick={() => setActiveIndex((activeIndex - 1 + gallery.items.length) % gallery.items.length)}
                style={{
                  position: 'absolute',
                  left: '18px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(5,5,5,0.35)',
                  color: '#F5F0E8',
                  fontSize: '22px',
                }}
              >
                â€¹
              </button>

              <button
                type="button"
                onClick={() => setActiveIndex((activeIndex + 1) % gallery.items.length)}
                style={{
                  position: 'absolute',
                  right: '18px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(5,5,5,0.35)',
                  color: '#F5F0E8',
                  fontSize: '22px',
                }}
              >
                â€º
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '28px',
                    fontStyle: 'italic',
                    color: '#F5F0E8',
                    marginBottom: '8px',
                  }}
                >
                  {gallery.items[activeIndex].caption}
                </div>
                <div style={{ color: 'rgba(245,240,232,0.56)', lineHeight: 1.7 }}>
                  {gallery.items[activeIndex].alt}
                </div>
              </div>

              <div style={{ color: '#C9A96E', fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                {activeIndex + 1} / {gallery.items.length}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        @media (max-width: 768px) {
          .gallery-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .gallery-grid > div:first-child {
            grid-column: span 2 !important;
            aspect-ratio: 16/9 !important;
          }
          section.gallery-section { padding: 80px 24px !important; }
        }
        @media (max-width: 560px) {
          .gallery-grid {
            grid-template-columns: 1fr !important;
          }
          .gallery-grid > div {
            grid-column: span 1 !important;
            aspect-ratio: 4/5 !important;
          }
          .gallery-grid > div:first-child {
            grid-column: span 1 !important;
            aspect-ratio: 4/5 !important;
          }
        }
      `}</style>
    </section>
  );
}

