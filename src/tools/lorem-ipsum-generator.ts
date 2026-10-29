/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initLoremIpsum } from './lorem-ipsum.ts';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLoremIpsum);
} else {
  initLoremIpsum();
}
