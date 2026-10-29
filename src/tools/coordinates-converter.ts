/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { convertCoordinates } from '../utils/geoTimeUtils.ts';

export function initCoordinatesConverter(): void {
  const latInput = document.getElementById('coord-lat') as HTMLInputElement | null;
  const lngInput = document.getElementById('coord-lng') as HTMLInputElement | null;
  const ddOutput = document.getElementById('out-dd') as HTMLSpanElement | null;
  const dmsOutput = document.getElementById('out-dms') as HTMLSpanElement | null;
  const ddmOutput = document.getElementById('out-ddm') as HTMLSpanElement | null;
  const utmOutput = document.getElementById('out-utm') as HTMLSpanElement | null;
  const mapLink = document.getElementById('map-link') as HTMLAnchorElement | null;

  function update() {
    const lat = parseFloat(latInput?.value || '37.7749');
    const lng = parseFloat(lngInput?.value || '-122.4194');

    const res = convertCoordinates(lat, lng);

    if (ddOutput) ddOutput.textContent = res.dd.formatted;
    if (dmsOutput) dmsOutput.textContent = res.dms.formatted;
    if (ddmOutput) ddmOutput.textContent = res.ddm.formatted;
    if (utmOutput) utmOutput.textContent = res.utm;

    if (mapLink) {
      mapLink.href = `https://www.google.com/maps?q=${lat},${lng}`;
    }
  }

  [latInput, lngInput].forEach(el => el?.addEventListener('input', update));

  update();
}

document.addEventListener('DOMContentLoaded', initCoordinatesConverter);
