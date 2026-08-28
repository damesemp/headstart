// Round 5 — the Astute frame. A full-width brand bar and a two-level footer
// wrap the app so the subdomain reads as part of astutegroup.com rather than a
// separate tool. Content sits in a centred wrapper, matching the new site;
// the bars themselves run full width.
//
// Link targets: only /franchise-lines/ and /contact-us/ are confirmed by
// Damian. The rest follow the same /en/<slug>/ pattern and are UNCONFIRMED —
// check them before this goes public.

const SITE = "https://astutegroup.com";
const NEW = "https://www-stage.astutegroup.com/en";

const HEADER_LINKS = [
  { label: "Franchised Distribution", href: `${NEW}/franchise-lines/` }, // confirmed
  { label: "Make Enquiry", href: `${NEW}/contact-us/` }, // confirmed
];

const FOOTER_COLUMNS = [
  {
    title: "Information",
    links: [
      { label: "About Us", href: `${NEW}/about-us/` },
      { label: "Product Categories", href: `${NEW}/product-categories/` },
      { label: "Franchise Lines", href: `${NEW}/franchise-lines/` }, // confirmed
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Privacy Policy", href: `${NEW}/privacy-policy/` },
      { label: "Data Protection", href: `${NEW}/data-protection/` },
      { label: "Cookie Policy", href: `${NEW}/cookie-policy/` },
      { label: "Terms of Purchase", href: `${NEW}/terms-of-purchase/` },
      { label: "Terms of Sale", href: `${NEW}/terms-of-sale/` },
    ],
  },
];

const SOCIAL = [
  {
    label: "Facebook",
    d: "M13 8h2V5h-2a3 3 0 0 0-3 3v2H8v3h2v6h3v-6h2.2l.3-3H13v-2a1 1 0 0 1 1-1z",
  },
  {
    label: "YouTube",
    d: "M3 8.5A2.5 2.5 0 0 1 5.5 6h9A2.5 2.5 0 0 1 17 8.5v3A2.5 2.5 0 0 1 14.5 14h-9A2.5 2.5 0 0 1 3 11.5v-3zM9 9v4l3.5-2L9 9z",
  },
  {
    label: "X",
    d: "M4 4h3.2l3.3 4.6L14.3 4H17l-5.2 6.1L17.4 18H14l-3.6-5-4.2 5H3.5l5.6-6.5L4 4z",
  },
  {
    label: "LinkedIn",
    d: "M5 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM3.6 8.4h2.8V18H3.6V8.4zM8.4 8.4h2.7v1.3a3 3 0 0 1 2.6-1.4c2 0 3.3 1.3 3.3 3.8V18h-2.8v-5.2c0-1.3-.5-2-1.6-2s-1.7.8-1.7 2V18H8.4V8.4z",
  },
  {
    label: "Instagram",
    d: "M7 3h6a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm3 4.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm4.2-1.2a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6z",
  },
];

export function BrandBar() {
  return (
    <header className="hs-brandbar">
      <div className="hs-wrapinner">
        <a
          className="hs-brandbar-logo"
          href={SITE}
          aria-label="Astute Group home"
        >
          <img src="/astute-logo.png" alt="Astute" width={112} height={22} />
        </a>
        <nav className="hs-brandbar-links" aria-label="Astute Group">
          {HEADER_LINKS.map((link, index) => (
            <span key={link.label} className="hs-brandbar-item">
              {index > 0 && <span className="hs-rule" aria-hidden="true" />}
              <a href={link.href} target="_blank" rel="noreferrer noopener">
                {link.label}
              </a>
            </span>
          ))}
          <span className="hs-brandbar-item">
            <span className="hs-rule" aria-hidden="true" />
            <a href={SITE} target="_blank" rel="noreferrer noopener">
              astutegroup.com
              <span className="hs-ext" aria-hidden="true">
                ↗
              </span>
            </a>
          </span>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter({ build }) {
  return (
    <footer className="hs-footer">
      <div className="hs-footer-main">
        <div className="hs-wrapinner hs-footer-cols">
          <div className="hs-footer-brand">
            <img src="/astute-logo.png" alt="Astute" width={112} height={22} />
            <p>
              Astute is an authorized distributor, as such all factory
              warranties are supported and honored in conjunction with your
              order. Thank you for your business.
            </p>
            <div className="hs-footer-social">
              {SOCIAL.map((icon) => (
                <a
                  key={icon.label}
                  href={SITE}
                  aria-label={icon.label}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <svg
                    viewBox="0 0 20 20"
                    width="18"
                    height="18"
                    aria-hidden="true"
                  >
                    <path d={icon.d} fill="currentColor" />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div className="hs-footer-col">
            <h2>Contact Us</h2>
            <p>
              ©Astute Electronics Ltd.
              <br />
              Registered in England
              <br />
              and Wales No.
              <br />
              GB2326213
            </p>
            <p>
              Astute House,
              <br />
              Rutherford Close
              <br />
              Stevenage,
              <br />
              Hertfordshire, SG1 2EF,
              <br />
              United Kingdom
            </p>
            <p>
              <a
                href={`${NEW}/contact-us/`}
                target="_blank"
                rel="noreferrer noopener"
              >
                Contact Us
              </a>
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div className="hs-footer-col" key={column.title}>
              <h2>{column.title}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="hs-footer-legal">
        <span>
          ©{new Date().getFullYear()} Astute Electronics Ltd. Registered in
          England and Wales No. GB2326213
        </span>
        {build ? (
          <>
            <span className="hs-rule" aria-hidden="true" />
            <span>Build: {build}</span>
          </>
        ) : null}
      </div>
    </footer>
  );
}
