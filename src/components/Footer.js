import React from 'react';
import { useSiteContent } from '../content/SiteContentContext';

export default function Footer() {
  const { siteContent } = useSiteContent();
  const footer = siteContent.footer;
  const global = siteContent.global;

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer
      style={{
        background: '#0A0A0A',
        borderTop: '1px solid rgba(201,169,110,0.1)',
        padding: '80px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '80px',
          right: '80px',
          height: '1px',
          background: 'linear-gradient(to right, transparent, rgba(201,169,110,0.4), transparent)',
        }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: '60px',
          marginBottom: '60px',
        }}
        className="footer-grid"
      >
        <div>
          <div
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '28px',
              fontWeight: 300,
              color: '#F5F0E8',
              marginBottom: '20px',
            }}
          >
            <span style={{ color: '#C9A96E', fontStyle: 'italic' }}>{siteContent.navbar.brandAccent} </span>
            {siteContent.navbar.brandName}
          </div>
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '13px',
              fontWeight: 300,
              lineHeight: 2,
              color: 'rgba(245,240,232,0.4)',
              maxWidth: '280px',
              marginBottom: '32px',
            }}
          >
            {footer.brandDescription}
          </p>
          <div
            style={{
              display: 'flex',
              gap: '12px',
            }}
          >
            {[
              {
                href: global.instagramUrl,
                label: 'Instagram',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                  </svg>
                ),
              },
              {
                href: global.whatsappUrl,
                label: 'WhatsApp',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.134.558 4.135 1.535 5.875L0 24l6.312-1.509A11.956 11.956 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.652-.518-5.165-1.417l-.371-.22-3.845.919.979-3.738-.242-.386A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                  </svg>
                ),
              },
            ].map((social, i) => (
              <a
                key={i}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                style={{
                  width: '40px',
                  height: '40px',
                  border: '1px solid rgba(201,169,110,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(245,240,232,0.5)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#C9A96E';
                  e.currentTarget.style.color = '#C9A96E';
                  e.currentTarget.style.background = 'rgba(201,169,110,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(201,169,110,0.2)';
                  e.currentTarget.style.color = 'rgba(245,240,232,0.5)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        <div>
          <div
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '10px',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#C9A96E',
              opacity: 0.7,
              fontWeight: 300,
              marginBottom: '28px',
            }}
          >
            Navegação
          </div>
          {[
            { label: 'Sobre', id: 'sobre' },
            { label: 'Especialidades', id: 'especialidades' },
            { label: 'Trajetória', id: 'trajetoria' },
            { label: 'Depoimentos', id: 'depoimentos' },
            { label: 'Contato', id: 'contato' },
          ].map((link) => (
            <div
              key={link.id}
              onClick={() => scrollTo(link.id)}
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '14px',
                fontWeight: 300,
                color: 'rgba(245,240,232,0.45)',
                marginBottom: '14px',
                cursor: 'pointer',
                transition: 'color 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#C9A96E';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = 'rgba(245,240,232,0.45)';
              }}
            >
              {link.label}
            </div>
          ))}
        </div>

        <div>
          <div
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '10px',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#C9A96E',
              opacity: 0.7,
              fontWeight: 300,
              marginBottom: '28px',
            }}
          >
            Contato
          </div>
          {footer.contactItems.map((item, i) => (
            <div
              key={i}
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '14px',
                fontWeight: 300,
                color: 'rgba(245,240,232,0.45)',
                marginBottom: '14px',
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '12px',
            fontWeight: 300,
            color: 'rgba(245,240,232,0.25)',
            letterSpacing: '0.08em',
          }}
        >
          {footer.copyrightPrefix} {new Date().getFullYear()} {footer.copyrightSuffix}
        </span>
        <span
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '13px',
            fontStyle: 'italic',
            color: 'rgba(201,169,110,0.35)',
          }}
        >
          {footer.tagline}
        </span>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          footer { padding: 60px 32px !important; }
        }
      `}</style>
    </footer>
  );
}
