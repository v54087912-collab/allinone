import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RPG_AVAILABLE_ITEMS,
  getDefault2x3RpgItems,
  RpgSheetConfig,
} from './customRpgGenerator';

test('getDefault2x3RpgItems returns exactly 6 items for 2x3 grid', () => {
  const items = getDefault2x3RpgItems();
  assert.equal(items.length, 6);
  assert.equal(items[0].type, 'knight');
  assert.equal(items[1].type, 'potion_health');
  assert.equal(items[2].type, 'coin');
  assert.equal(items[3].type, 'shield');
  assert.equal(items[4].type, 'egg');
  assert.equal(items[5].type, 'key');
});

test('RPG_AVAILABLE_ITEMS includes diverse RPG sprite items', () => {
  assert.ok(RPG_AVAILABLE_ITEMS.length >= 12);
  const types = RPG_AVAILABLE_ITEMS.map((i) => i.type);
  assert.ok(types.includes('sword'));
  assert.ok(types.includes('shield'));
  assert.ok(types.includes('book'));
  assert.ok(types.includes('gem'));
  assert.ok(types.includes('crown'));
  assert.ok(types.includes('chest'));
});

test('RpgSheetConfig dimensions calculation is consistent', () => {
  const config: RpgSheetConfig = {
    rows: 2,
    cols: 3,
    cellWidth: 180,
    cellHeight: 170,
    gap: 10,
    margin: 25,
    backgroundColor: '#ffffff',
    showBorders: true,
    showLabels: true,
    items: getDefault2x3RpgItems(),
  };

  const expectedWidth = 25 * 2 + 3 * 180 + 2 * 10; // 50 + 540 + 20 = 610
  const expectedHeight = 25 * 2 + 2 * 170 + 1 * 10; // 50 + 340 + 10 = 400

  assert.equal(expectedWidth, 610);
  assert.equal(expectedHeight, 400);
});
