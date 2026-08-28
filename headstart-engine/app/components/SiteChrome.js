// Round 5 — the Astute frame. A full-width brand bar and footer wrap the whole
// app so the subdomain reads as part of astutegroup.com rather than a separate
// tool. Solid colour, no header image (confirmed 27 August). Logo proportions
// are measured from the live site: 34.2% of bar height, natural aspect
// 5.087:1 — so 22 x 112 on a 64px bar. See HEADSTART_BUILD_INSTRUCTIONS_5.md.

const SITE = "https://astutegroup.com";

const LINKS = [
  { label: "Manufacturers", href: `${SITE}/manufacturers` },
  { label: "Applications", href: `${SITE}/applications` },
  { label: "Contact us", href: `${SITE}/contact-us` },
];

export function BrandBar() {
  return (
    <header className="hs-brandbar">
      <a
        className="hs-brandbar-logo"
        href={SITE}
        aria-label="Astute Group home"
      >
        <img src="/astute-logo.png" alt="Astute" width={112} height={22} />
      </a>
      <nav className="hs-brandbar-links" aria-label="Astute Group">
        {LINKS.map((link, index) => (
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
    </header>
  );
}

export function SiteFooter({ build }) {
  return (
    <footer className="hs-footbar">
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
    </footer>
  );
}
