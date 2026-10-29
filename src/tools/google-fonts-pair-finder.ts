/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function initGoogleFontsPairFinder(): void {
  const pairSelect = document.getElementById('pair-select') as HTMLSelectElement | null;
  const headingFontEl = document.getElementById('preview-heading') as HTMLHeadingElement | null;
  const bodyFontEl = document.getElementById('preview-body') as HTMLParagraphElement | null;
  const subheadFontEl = document.getElementById('preview-subhead') as HTMLParagraphElement | null;
  const buttonFontEl = document.getElementById('preview-button') as HTMLButtonElement | null;
  const embedCodePre = document.getElementById('embed-code') as HTMLPreElement | null;
  const copyEmbedBtn = document.getElementById('copy-embed-btn') as HTMLButtonElement | null;
  const copyCssBtn = document.getElementById('copy-css-btn') as HTMLButtonElement | null;
  const headingNameBadge = document.getElementById('heading-name') as HTMLSpanElement | null;
  const bodyNameBadge = document.getElementById('body-name') as HTMLSpanElement | null;

  interface FontPair {
    id: string;
    name: string;
    heading: string;
    body: string;
    category: string;
    googleQuery: string;
  }

  const pairs: FontPair[] = [
    {
      id: 'playfair-source',
      name: 'Playfair Display + Source Sans 3',
      heading: "'Playfair Display', serif",
      body: "'Source Sans 3', sans-serif",
      category: 'Editorial Luxury',
      googleQuery: 'family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@400;600'
    },
    {
      id: 'montserrat-merriweather',
      name: 'Montserrat + Merriweather',
      heading: "'Montserrat', sans-serif",
      body: "'Merriweather', serif",
      category: 'Modern Magazine',
      googleQuery: 'family=Merriweather:wght@300;400&family=Montserrat:wght@700;800'
    },
    {
      id: 'oswald-lato',
      name: 'Oswald + Lato',
      heading: "'Oswald', sans-serif",
      body: "'Lato', sans-serif",
      category: 'Bold & Punchy',
      googleQuery: 'family=Lato:wght@400;700&family=Oswald:wght@600;700'
    },
    {
      id: 'jakarta-lora',
      name: 'Plus Jakarta Sans + Lora',
      heading: "'Plus Jakarta Sans', sans-serif",
      body: "'Lora', serif",
      category: 'Elegant SaaS',
      googleQuery: 'family=Lora:ital,wght@0,400;0,500;1,400&family=Plus+Jakarta+Sans:wght@700;800'
    },
    {
      id: 'space-inter',
      name: 'Space Grotesk + Inter',
      heading: "'Space Grotesk', sans-serif",
      body: "'Inter', sans-serif",
      category: 'Tech & Fintech',
      googleQuery: 'family=Inter:wght@400;500;600&family=Space+Grotesk:wght@600;700'
    },
    {
      id: 'roboto-open',
      name: 'Roboto Slab + Open Sans',
      heading: "'Roboto Slab', serif",
      body: "'Open Sans', sans-serif",
      category: 'Classic Publishing',
      googleQuery: 'family=Open+Sans:wght@400;600&family=Roboto+Slab:wght@700'
    }
  ];

  let currentPair = pairs[0];

  function loadGoogleFont(query: string) {
    const linkId = 'google-font-preview-link';
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?${query}&display=swap`;
  }

  function update() {
    const selectedId = pairSelect?.value || pairs[0].id;
    currentPair = pairs.find(p => p.id === selectedId) || pairs[0];

    loadGoogleFont(currentPair.googleQuery);

    if (headingFontEl) headingFontEl.style.fontFamily = currentPair.heading;
    if (subheadFontEl) subheadFontEl.style.fontFamily = currentPair.heading;
    if (bodyFontEl) bodyFontEl.style.fontFamily = currentPair.body;
    if (buttonFontEl) buttonFontEl.style.fontFamily = currentPair.body;

    if (headingNameBadge) headingNameBadge.textContent = currentPair.heading.replace(/['"]/g, '').split(',')[0];
    if (bodyNameBadge) bodyNameBadge.textContent = currentPair.body.replace(/['"]/g, '').split(',')[0];

    if (embedCodePre) {
      embedCodePre.textContent = `<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?${currentPair.googleQuery}&display=swap" rel="stylesheet">`;
    }
  }

  if (pairSelect) {
    pairSelect.addEventListener('change', update);
  }

  if (copyEmbedBtn && embedCodePre) {
    copyEmbedBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(embedCodePre.textContent || '');
      copyEmbedBtn.textContent = 'Copied!';
      setTimeout(() => { copyEmbedBtn.textContent = 'Copy HTML Link'; }, 1500);
    });
  }

  if (copyCssBtn) {
    copyCssBtn.addEventListener('click', async () => {
      const cssRules = `h1, h2, h3, h4 { font-family: ${currentPair.heading}; }\nbody, p, button, input { font-family: ${currentPair.body}; }`;
      await navigator.clipboard.writeText(cssRules);
      copyCssBtn.textContent = 'Copied!';
      setTimeout(() => { copyCssBtn.textContent = 'Copy CSS Rules'; }, 1500);
    });
  }

  update();
}

document.addEventListener('DOMContentLoaded', initGoogleFontsPairFinder);
