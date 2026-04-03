import React, { useRef, useEffect } from 'react';
import { useSiteContent } from '../content/SiteContentContext';

function useInView(threshold = 0.1) {
  const ref = useRef(null);
  const [inView, setInView] = React.useState(false);
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

export default function Contact() {
  const [ref, inView] = useInView(0.1);
  const { siteContent } = useSiteContent();
  const contact = siteContent.contact;
  const global = siteContent.global;

  const getAction = (type) => {
    if (type === 'whatsapp') return () => window.open(global.whatsappUrl, '_blank');
    if (type === 'instagram') return () => window.open(global.instagramUrl, '_blank');
    return undefined;
  };

  return (
    <section
      id="contato"
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
          bottom: '-150px',
          left: '-150px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,169,110,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '-120px',
          right: '-120px',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,169,110,0.07) 0%, transparent 70%)',
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
          {contact.sectionLabel}
        </span>
        <div style={{ width: '80px', height: '1px', background: 'rgba(201,169,110,0.3)' }} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '100px',
          alignItems: 'start',
          maxWidth: '1200px',
        }}
        className="contact-grid"
      >
        <div
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateX(0)' : 'translateX(-40px)',
            transition: 'all 1s ease 0.2s',
          }}
        >
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(40px, 4vw, 62px)',
              fontWeight: 300,
              lineHeight: 1.1,
              color: '#F5F0E8',
              marginBottom: '24px',
            }}
          >
            {contact.titlePrefix}
            <br />
            <em style={{ color: '#C9A96E' }}>{contact.titleAccent}</em>
          </h2>
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '15px',
              fontWeight: 300,
              lineHeight: 1.9,
              color: 'rgba(245,240,232,0.55)',
              marginBottom: '60px',
              maxWidth: '420px',
            }}
          >
            {contact.description}
          </p>

          {contact.cards.map((info, i) => (
            <div
              key={i}
              onClick={getAction(info.type)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '20px 0',
                borderBottom: '1px solid rgba(201,169,110,0.1)',
                cursor: getAction(info.type) ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                if (getAction(info.type)) e.currentTarget.style.paddingLeft = '8px';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.paddingLeft = '0px';
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  border: '1px solid rgba(201,169,110,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  flexShrink: 0,
                  color: '#C9A96E',
                  fontFamily: "'Outfit', sans-serif",
                  letterSpacing: '0.12em',
                }}
              >
                {info.label.charAt(0)}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '11px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: '#C9A96E',
                    opacity: 0.7,
                    fontWeight: 300,
                    marginBottom: '4px',
                  }}
                >
                  {info.label}
                </div>
                <div
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '15px',
                    fontWeight: 300,
                    color: '#F5F0E8',
                  }}
                >
                  {info.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateX(0)' : 'translateX(40px)',
            transition: 'all 1s ease 0.4s',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(26,26,26,0.98) 0%, rgba(16,16,16,0.98) 100%)',
              border: '1px solid rgba(201,169,110,0.12)',
              padding: '56px 48px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 26px 60px rgba(0,0,0,0.22)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '26px',
                right: '26px',
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                border: '1px solid rgba(201,169,110,0.18)',
                opacity: 0.9,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '42px',
                right: '42px',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(201,169,110,0.24) 0%, rgba(201,169,110,0.02) 68%, transparent 100%)',
              }}
            />
            <h3
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '28px',
                fontWeight: 400,
                color: '#F5F0E8',
                marginBottom: '12px',
              }}
            >
              {contact.panelTitle}
            </h3>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '14px',
                fontWeight: 300,
                color: 'rgba(245,240,232,0.55)',
                marginBottom: '32px',
                lineHeight: 1.9,
              }}
            >
              {contact.panelBody}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '36px' }}>
              {contact.panelBullets.map((item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    color: 'rgba(245,240,232,0.7)',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '14px',
                    fontWeight: 300,
                    lineHeight: 1.7,
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
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '14px',
                marginBottom: '34px',
              }}
              className="contact-premium-grid"
            >
              <div style={{ padding: '14px 16px', borderRadius: '18px', background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.16)' }}>
                <div style={{ color: '#C9A96E', fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Atendimento
                </div>
                <div style={{ color: '#F5F0E8', lineHeight: 1.6 }}>
                  Fluxo orientado pela equipe
                </div>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: '18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#C9A96E', fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Especialidade
                </div>
                <div style={{ color: '#F5F0E8', lineHeight: 1.6 }}>
                  Face, pescoco e cirurgia geral
                </div>
              </div>
            </div>

            <a
              href={`${global.whatsappUrl}?text=${encodeURIComponent(global.whatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: '100%',
                padding: '18px',
                background: '#C9A96E',
                color: '#1A1A1A',
                border: '1px solid #C9A96E',
                fontFamily: "'Outfit', sans-serif",
                fontSize: '12px',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                fontWeight: 400,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#C9A96E';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#C9A96E';
                e.currentTarget.style.color = '#1A1A1A';
              }}
            >
              {contact.buttonLabel}
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .contact-grid { grid-template-columns: 1fr !important; gap: 60px !important; }
          section#contato { padding: 80px 32px !important; }
          .contact-premium-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
