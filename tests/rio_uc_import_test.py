"""Scientific matching and source-boundary regression checks for the importer."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("uc", Path(__file__).resolve().parents[1] / "scripts/import_rio_uc.py")
uc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(uc)


class ImportTests(unittest.TestCase):
    def test_missing_status_is_unknown_and_infraspecific_status_is_not_inherited(self):
        names = {"Euterpe edulis": "Arecaceae"}
        record = uc.parse_row("Arecaceae  Euterpe edulis Mart.  Collector 123, RB 456", names)
        self.assertIsNone(record["category"])
        self.assertIsNone(uc.parse_row("Arecaceae  Euterpe edulis var. example  Collector 123  EN", names))
        self.assertIsNone(uc.parse_row("Araceae  Euterpe edulis Mart.  Collector 123  EN", names))
        self.assertIsNone(uc.parse_row("Arecaceae  Euterpe edulisii Mart.  Collector 123  EN", names))

    def test_records_do_not_bleed_across_chapters_or_bibliographies(self):
        pages = [""] * 23 + [
            "1. PARQUE ESTADUAL DA CHACRINHA\nUC introduction",
            "MMA 443/2014\nArecaceae  Euterpe edulis Mart.  Collector 123  VU",
            "Bibliografia\nArecaceae  Euterpe edulis Mart.  Not a table",
            "2. PARQUE ESTADUAL CUNHAMBEBE\nUC introduction",
            "MMA 443/2014\nArecaceae  Euterpe edulis Mart.  Collector 456",
        ]
        rows, _ = uc.extract(pages, {"Euterpe edulis": "Arecaceae"})
        self.assertEqual([r["unit"] for r in rows], ["Parque Estadual da Chacrinha", "Parque Estadual Cunhambebe"])
        self.assertEqual([r["sourcePage"] for r in rows], [25, 28])

    def test_import_is_idempotent_preserves_other_sources_and_does_not_promote_geography(self):
        other = {"source": {"url": "https://example.org/evidence"}, "note": "editor work"}
        plant = {"scientificName": "Euterpe edulis", "rank": "species", "geography": "rio-state", "regionalEvidence": [other], "photos": ["preserved"]}
        catalog = {"plants": [plant]}
        row = {"scientificName": "Euterpe edulis", "unit": "Parque Estadual da Chacrinha", "voucher": "RB 123", "sourcePage": 45, "category": "VU", "endemicToRioState": False}
        source = {"url": uc.URL}
        for _ in range(2):
            uc.apply_records(catalog, [row], source)
        self.assertEqual(len(plant["regionalEvidence"]), 2)
        self.assertEqual(plant["regionalEvidence"][0], other)
        self.assertEqual(plant["geography"], "rio-state")
        self.assertEqual(plant["photos"], ["preserved"])
        self.assertNotIn("endemicToRioState", plant["regionalEvidence"][1])
        self.assertEqual(plant["regionalEvidence"][1]["conservationUnits"][0]["municipality"], "Rio de Janeiro")


if __name__ == "__main__":
    unittest.main()
