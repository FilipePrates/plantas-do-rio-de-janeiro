"""Prepare visual contact sheets and apply explicitly recorded photo annotations.

No inference from observation annotations or from a taxon name. Each selected
caption/tag must be recorded after viewing the actual photograph. New editorial
annotations remain draft. Existing rights, bytes, gallery order and warnings stay.
"""
import argparse
import copy
import csv
from collections import Counter
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'sources/photo-annotations-2026-11-11'
PREVIEWS = ROOT / 'backups/photo-annotations-2026-11-11'
CATALOG = ROOT / 'src/data/plants.json'
MARKERS = {'flower', 'fruit', 'leaf', 'bark', 'wholePlant', 'seed', 'root', 'unknown'}

def read(path):
    return json.loads(path.read_text(encoding='utf8'))

def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf8')

def prepare():
    from PIL import Image, ImageDraw, ImageFont, ImageOps
    OUT.mkdir(exist_ok=True)
    PREVIEWS.mkdir(exist_ok=True)
    catalog = read(CATALOG)
    baseline = OUT / 'catalog-before.json'
    if not baseline.exists():
        write(baseline, catalog)
    assert read(baseline) == catalog, 'Catalog changed since the annotation pass started.'
    rows = [(p, ph) for p in catalog['plants'] for ph in p['photos']]
    font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 17)
    small = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 14)
    index = []
    for start in range(0, len(rows), 20):
        canvas = Image.new('RGB', (1600, 1800), '#f5f2e8')
        draw = ImageDraw.Draw(canvas)
        for slot, (p, ph) in enumerate(rows[start:start+20]):
            x, y = slot%4*400, slot//4*360
            with Image.open(ROOT/'assets/plants'/ph['fileName']) as source:
                thumbnail = ImageOps.contain(ImageOps.exif_transpose(source).convert('RGB'), (390, 285))
            canvas.paste(thumbnail, (x+(400-thumbnail.width)//2, y))
            number = start+slot+1
            draw.text((x+5,y+287), f"{number:03d} | {ph['photoId']} | {p['scientificName']}", font=small, fill='#14331d')
            draw.text((x+5,y+309), ', '.join(ph['markers'])+' / '+ph['reviewStatus'], font=small, fill='#14331d')
            draw.text((x+5,y+330), ('LEGENDA: '+ph['caption'])[:56] if ph['caption'].strip() else 'SEM LEGENDA', font=small, fill='#67482a')
            index.append(dict(number=number, sheet=start//20+1, plantId=p['id'], scientificName=p['scientificName'], photoId=ph['photoId'], fileName=ph['fileName'], caption=ph['caption'], markers=ph['markers'], reviewStatus=ph['reviewStatus']))
        canvas.save(PREVIEWS/f'sheet-{start//20+1:02d}.jpg', quality=91)
    write(OUT/'index.json', index)
    if not (OUT/'annotations.json').exists():
        write(OUT/'annotations.json', {})
    print(f'{len(rows)} photographs; {(len(rows)+19)//20} visual sheets. Catalog unchanged.')

def apply():
    assert not (OUT/'audit.json').exists(), 'Annotation pass already applied; preserve later edits.'
    baseline = read(OUT/'catalog-before.json')
    assert read(CATALOG) == baseline, 'Catalog changed; merge explicitly.'
    annotations = read(OUT/'annotations.json')
    photo_ids = {str(ph['photoId']) for p in baseline['plants'] for ph in p['photos']}
    assert set(annotations) == photo_ids, 'Every local photo must have a visual review record.'
    catalog = copy.deepcopy(baseline)
    changes = []
    for plant in catalog['plants']:
        for photo in plant['photos']:
            annotation = annotations.get(str(photo['photoId']))
            if annotation is None:
                continue
            assert annotation.get('viewed') is True
            assert set(annotation) <= {'viewed', 'caption', 'markers', 'note'}
            previous = copy.deepcopy(photo)
            if 'caption' in annotation:
                # Preserve previous captions/warnings verbatim; append only when
                # an identification/cultivation caution lacks a visual caption.
                new_caption = annotation['caption'].strip()
                assert new_caption
                if photo['caption'].strip():
                    assert photo['caption'].strip().startswith(('Identificação a conferir:', 'Conferir identificação')), f'Existing descriptive caption must be preserved: {photo["photoId"]}'
                    photo['caption'] = new_caption + ' ' + photo['caption']
                else:
                    photo['caption'] = new_caption
            if 'markers' in annotation:
                markers = annotation['markers']
                assert markers and len(markers) == len(set(markers)) and set(markers) <= MARKERS
                assert 'unknown' not in markers or markers == ['unknown']
                photo['markers'] = markers
            if photo != previous:
                photo['reviewStatus'] = 'draft'
                assert {k:v for k,v in photo.items() if k not in ['caption','markers','reviewStatus']} == {k:v for k,v in previous.items() if k not in ['caption','markers','reviewStatus']}
                changes.append(dict(plantId=plant['id'], scientificName=plant['scientificName'], photoId=photo['photoId'], before={k:previous[k] for k in ['caption','markers','reviewStatus']}, after={k:photo[k] for k in ['caption','markers','reviewStatus']}, note=annotation.get('note','')))
    assert all(ph['caption'].strip() for p in catalog['plants'] for ph in p['photos']), 'A photo still has no caption.'
    # This pass cannot change membership, ordering, plant text or any other field.
    restored = copy.deepcopy(catalog)
    for plant, old_plant in zip(restored['plants'], baseline['plants'], strict=True):
        assert len(plant['photos']) == len(old_plant['photos'])
        for photo, old_photo in zip(plant['photos'], old_plant['photos'], strict=True):
            for field in ['caption', 'markers', 'reviewStatus']:
                photo[field] = old_photo[field]
    assert restored == baseline, 'Unexpected change outside photo annotations.'
    write(CATALOG, catalog)
    write(OUT/'audit.json', dict(date='2026-11-11', method='Direct visual inspection of local photographs, independent of observation phenology. AI editorial drafts; human approval pending.', baselineSha256=hashlib.sha256((OUT/'catalog-before.json').read_bytes()).hexdigest(), catalogSha256=hashlib.sha256(CATALOG.read_bytes()).hexdigest(), viewedPhotos=len(annotations), changedPhotos=len(changes), changes=changes))
    print(f'{len(changes)} photographs annotated; all altered annotations remain draft.')

def collect():
    index = {r['number']:r for r in read(OUT/'index.json')}
    annotations = {}
    seen = set()
    for path in sorted(OUT.glob('notes-*.txt')):
        for line in path.read_text(encoding='utf8').splitlines():
            if not line.strip() or line.startswith('#'):
                continue
            number, markers, caption = line.split('|', 2)
            number = int(number)
            assert number in index and number not in seen, number
            seen.add(number)
            row = dict(viewed=True)
            if markers != '-': row['markers'] = markers.split(',')
            if caption != '-': row['caption'] = caption
            annotations[str(index[number]['photoId'])] = row
    write(OUT/'annotations.json', annotations)
    print(f'{len(seen)} individually viewed photos recorded; {len(index)-len(seen)} remain.')

def report():
    before = read(OUT/'catalog-before.json')
    catalog = read(CATALOG)
    audit = read(OUT/'audit.json')
    assert hashlib.sha256(CATALOG.read_bytes()).hexdigest() == audit['catalogSha256'], 'Catalog changed after this pass.'
    old = {ph['photoId']:ph for p in before['plants'] for ph in p['photos']}
    rows = [(p, ph) for p in catalog['plants'] for ph in p['photos']]
    summary = dict(
        date='2026-11-11', viewedPhotos=len(rows), changedPhotos=audit['changedPhotos'],
        missingCaptionsBefore=sum(not ph['caption'].strip() for ph in old.values()),
        missingCaptionsAfter=sum(not ph['caption'].strip() for p, ph in rows),
        existingWarningsWithVisualDescriptionAdded=sum(bool(c['before']['caption'].strip()) and c['before']['caption'] != c['after']['caption'] for c in audit['changes']),
        photosWithChangedTags=sum(c['before']['markers'] != c['after']['markers'] for c in audit['changes']),
        tagsBefore=dict(Counter(tag for ph in old.values() for tag in ph['markers'])),
        tagsAfter=dict(Counter(tag for p, ph in rows for tag in ph['markers'])),
        photoReviewAfter=dict(Counter(ph['reviewStatus'] for p, ph in rows)),
        originalMediaBytesAdded=0, galleryOrderChanged=False,
        humanApproval='All changed captions/tags remain draft. Existing untouched approvals are preserved.',
        baselineSha256=audit['baselineSha256'], catalogSha256=audit['catalogSha256'],
        unknownPhotos=[dict(plantId=p['id'], scientificName=p['scientificName'], photoId=ph['photoId'], caption=ph['caption']) for p, ph in rows if ph['markers'] == ['unknown']],
        additionalReview=[dict(photoId=ph['photoId'], scientificName=p['scientificName'], caption=ph['caption']) for p, ph in rows if ph['photoId'] in [354855356, 691168057]],
    )
    write(ROOT/'docs/photo-annotations-2026-11-11.json', summary)
    with (ROOT/'docs/photo-annotations-2026-11-11.csv').open('w', encoding='utf-8-sig', newline='') as handle:
        writer = csv.writer(handle)
        writer.writerow(['plantId', 'scientificName', 'photoId', 'fileName', 'captionBefore', 'captionAfter', 'markersBefore', 'markersAfter', 'reviewStatus'])
        for plant, photo in rows:
            previous = old[photo['photoId']]
            writer.writerow([plant['id'], plant['scientificName'], photo['photoId'], photo['fileName'], previous['caption'], photo['caption'], ','.join(previous['markers']), ','.join(photo['markers']), photo['reviewStatus']])
    print(json.dumps({k:v for k,v in summary.items() if k not in ['unknownPhotos','additionalReview']}, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['prepare','collect','apply','report'])
    globals()[parser.parse_args().command]()
