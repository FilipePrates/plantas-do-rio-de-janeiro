"""Deterministic local preview assets; full licensed originals stay unchanged."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
catalog = json.loads((ROOT / 'src/data/plants.json').read_text())
target = ROOT / 'assets/plants/thumbnails'
target.mkdir(parents=True, exist_ok=True)
manifest_path = ROOT / 'src/data/plant-thumbnail-manifest.json'
previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
manifest = {}
for plant in catalog['plants']:
    for photo in plant['photos']:
        source = ROOT / 'assets/plants' / photo['fileName']
        if hashlib.sha256(source.read_bytes()).hexdigest() != photo['sha256']:
            raise ValueError(f'Source hash mismatch: {source.name}')
        filename = photo['id'] + '.webp'
        destination = target / filename
        cached = previous.get(photo['fileName'])
        if (cached and cached['fileName'] == filename
                and cached['sourceSha256'] == photo['sha256']
                and destination.exists()
                and hashlib.sha256(destination.read_bytes()).hexdigest() == cached['sha256']):
            manifest[photo['fileName']] = cached
            continue
        with Image.open(source) as image:
            image = ImageOps.exif_transpose(image).convert('RGB')
            ImageOps.fit(image, (320, 320), method=Image.Resampling.LANCZOS).save(destination, 'WEBP', quality=78, method=4)
        manifest[photo['fileName']] = {'fileName': filename, 'sourceSha256': photo['sha256'], 'sha256': hashlib.sha256(destination.read_bytes()).hexdigest()}
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
lines = ['// Generated resized/cropped 320px previews; source files retain archived license evidence.', 'import type { ImageSourcePropType } from "react-native";', 'export const plantThumbnails: Record<string, ImageSourcePropType> = {']
lines += [f'  {json.dumps(source)}: require({json.dumps("../../assets/plants/thumbnails/" + item["fileName"])}),' for source, item in sorted(manifest.items())]
lines += ['};', '']
(ROOT / 'src/data/plant-thumbnails.ts').write_text('\n'.join(lines))
print(f'{len(manifest)} local previews generated (320 × 320 WebP).')
