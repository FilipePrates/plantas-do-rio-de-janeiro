import test from 'node:test';
import assert from 'node:assert/strict';
import { getMainPhoto, normalizeMainPhoto, mainPhotoKinds } from '../src/presentation.mjs';

test('main photo preference selects a matching photo without changing gallery order', () => {
  const standard = { id: 'first', markers: ['unknown'] };
  const flower = { id: 'flower', markers: ['flower', 'leaf'] };
  const plant = { photos: [standard, flower] };
  assert.equal(getMainPhoto(plant, 'flower'), flower);
  assert.equal(getMainPhoto(plant, 'leaf'), flower);
  assert.equal(getMainPhoto(plant, 'fruit'), standard);
  assert.equal(getMainPhoto(plant, 'default'), standard);
  assert.equal(plant.photos[0], standard);
  assert.equal(getMainPhoto({ photos: [] }, 'flower'), undefined);
});

test('older preferences and invalid photo types fall back to default', () => {
  for (const value of [undefined, null, 'unknown', 'invalid', {}]) {
    assert.equal(normalizeMainPhoto(value), 'default');
  }
  for (const kind of mainPhotoKinds) assert.equal(normalizeMainPhoto(kind), kind);
  assert.equal(mainPhotoKinds.length, 8);
});
