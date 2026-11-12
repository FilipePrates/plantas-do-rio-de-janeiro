"""Verify the test APK contains the current offline catalog's actual image bytes.

Identity, Android version and signing are checked separately with SDK tools.
This checks every original/thumbnail and the selected new names in the embedded
Hermes bundle, avoiding a successful-but-stale Android artifact.
"""
import argparse
import hashlib
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('apk', type=Path)
parser.add_argument('--output', type=Path)
args = parser.parse_args()
catalog_path = ROOT / 'src/data/plants.json'
catalog = json.loads(catalog_path.read_text(encoding='utf8'))
audit = json.loads((ROOT / 'sources/photo-selection-2026-11-11/audit.json').read_text(encoding='utf8'))
thumbs = json.loads((ROOT / 'src/data/plant-thumbnail-manifest.json').read_text(encoding='utf8'))
expected = {ph['sha256']: ph['fileName'] for p in catalog['plants'] for ph in p['photos']}
expected.update({t['sha256']: t['fileName'] for t in thumbs.values()})
with zipfile.ZipFile(args.apk) as apk:
    assert apk.testzip() is None, 'Corrupt APK ZIP member'
    actual = set()
    for member in apk.infolist():
        if member.filename.endswith(('.jpg', '.jpeg', '.webp', '.png')):
            actual.add(hashlib.sha256(apk.read(member)).hexdigest())
    missing = [name for digest, name in expected.items() if digest not in actual]
    assert not missing, f'Photos missing or changed in APK: {missing}'
    bundle = apk.read('assets/index.android.bundle')
    for name in audit['newSpecies']:
        assert name.encode('utf8') in bundle, f'Current catalog name missing from embedded bundle: {name}'
    # Hermes stores strings as UTF-8/Latin-1 or UTF-16 depending on characters.
    # Check the final bibliography correction too, not just membership.
    solanum = next(p for p in catalog['plants'] if p['scientificName'] == 'Solanum cernuum')
    title = next(s['title'] for s in solanum['sources'] if 'Santa Cândida' in s['title'])
    assert any(title.encode(encoding) in bundle for encoding in ['utf8', 'utf-16le']), 'Embedded bibliography predates the final catalog'
    stifftia = next(p for p in catalog['plants'] if p['scientificName'] == 'Stifftia fruticosa')
    assert stifftia['commonName'].encode('utf8') in bundle, 'Final sourced common name missing from embedded bundle'
    # A content-only rebuild must include the latest annotations, not just the
    # same species and photographs. Hermes may store Unicode strings as UTF-16.
    captions = {ph['caption'] for p in catalog['plants'] for ph in p['photos'] if ph['caption'].strip()}
    for caption in captions:
        encoded = [caption.encode('utf8'), caption.encode('utf-16le')]
        try:
            encoded.append(caption.encode('latin1'))
        except UnicodeEncodeError:
            pass
        assert any(value in bundle for value in encoded), f'Current photo caption missing from embedded bundle: {caption}'
    profile_strings = {p[field] for p in catalog['plants'] for field in ['scientificName', 'description', 'identification', 'ecology'] if p[field].strip()}
    for value in profile_strings:
        encodings = ['utf8', 'utf-16le']
        if all(ord(character) < 256 for character in value):
            encodings.append('latin1')
        assert any(value.encode(encoding) in bundle for encoding in encodings), f'Current profile text missing from embedded bundle: {value[:100]}'
    assert b'Atualizando resultados' in bundle, 'Search loading indicator missing from embedded bundle'
    architectures = sorted({n.split('/')[1] for n in apk.namelist() if n.startswith('lib/') and n.endswith('.so')})
result = dict(apk=args.apk.name, bytes=args.apk.stat().st_size, sha256=hashlib.sha256(args.apk.read_bytes()).hexdigest(), catalogSha256=hashlib.sha256(catalog_path.read_bytes()).hexdigest(), entries=len(catalog['plants']), representedSpecies=len({member['scientificName'] for plant in catalog['plants'] for member in (plant['regionalSpecies'] if plant['rank'] == 'genus' else [plant])}), illustratedProfiles=sum(bool(p['photos']) and p.get('presentation') != 'checklist' for p in catalog['plants']), originalPhotos=sum(len(p['photos']) for p in catalog['plants']), thumbnails=len(thumbs), allPhotoAndThumbnailBytesVerified=True, selectedNewSpeciesInEmbeddedBundle=True, architectures=architectures, deviceRuntimeTested=False)
result.update(uniqueCurrentCaptionsVerified=len(captions), allCurrentCaptionsInEmbeddedBundle=True)
result.update(currentProfileStringsVerified=len(profile_strings), allCurrentProfileTextInEmbeddedBundle=True, searchLoadingIndicatorInEmbeddedBundle=True)
if args.output:
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf8')
print(json.dumps(result, ensure_ascii=False, indent=2))
