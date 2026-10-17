# Botanical draft: evidence and limits

Prepared on 16 October 2026. The canonical scope is native Atlantic Forest
flora of Rio de Janeiro city, with explicitly labeled state-level extensions.
This draft is an initial editorial subset, not an exhaustive native checklist.

## Native membership and grouped genera

Primary source: Jardim Botânico do Rio de Janeiro, Flora e Funga do Brasil.
Official service documentation:
https://www.gov.br/jbrj/pt-br/acesso-a-informacao/dados-abertos-1/servicos-web
API: https://servicos.jbrj.gov.br/v2/flora/

Keep only records with `taxonrank=ESPECIE`, `taxonomicstatus=NOME_ACEITO`,
and a distribution row containing `BR-RJ`, `establishmentmeans=Nativa`, and
`Mata Atlântica` in `phytogeographicDomain`. The API's distribution property
is spelled `distribuition`. Do not infer native status from iNaturalist
presence, from garden records, or from a Brazilian native range alone.

Grouping Anthurium and Philodendron is an identification/UI decision. Member
species remain explicitly enumerated, source IDs remain attached, and the
1,500-species ceiling includes every member. Counts reflect the cached source
version and state/domain filter. A terrestrial-substrate count is given
separately. These are neither municipal counts nor claims that every member
can be identified from one representative photograph.

Source data and vernacular names retain JBRJ attribution and source links.
Draft descriptive sentences summarize structured factual attributes rather
than copying monograph descriptions. Detailed field characters remain an
editorial task. No JBRJ photographs or herbarium images are reused.

## Five invasive selections

This is an editorial selection, not an abundance or ecological-impact ranking.

- Leucaena leucocephala — leucena.
- Tradescantia zebrina — zebrina.
- Artocarpus heterophyllus — jaqueira; municipal list uses Artocarpus integrifolia.
- Megathyrsus maximus — capim-colonião; municipal list uses Panicum maximum.
- Epipremnum aureum — jiboia; local invasive evidence needs further review.

The first four are listed in the historical municipal primary source,
Resolução SMAC 492/2011, Annex:
https://www.rio.rj.gov.br/dlstatic/10112/4571912/4115297/RESSMAC4922011invasoras.pdf
This historical source is used for botanical evidence, not as a claim about
the current legal list or removal permissions.

The JBRJ 2024 PIBIC abstracts describe E. aureum as invasive in tropical and
subtropical climates and study it in the Rio arboretum:
https://www.gov.br/jbrj/pt-br/assuntos/educacao/livro-de-resumos_pibic-2024_-versao-final-1-2.pdf
This supports an invasive-status draft and occurrence in the city, but does
not establish invasion in municipal native forest. The municipal Bosque da
Barra page calls a plant jiboia while naming E. pinnatum:
https://ambienteclima.prefeitura.rio/parque-nacional-municipal-bosque-da-barra/
Do not silently treat E. pinnatum and E. aureum as synonyms. The requested
E. aureum entry remains draft pending local taxonomic and invasion review.

## Photos

Only iNaturalist photo-level CC0. The observation's metadata license is a
different field, as documented by iNaturalist:
https://help.inaturalist.org/en/support/solutions/articles/151000173511
API documentation: https://api.inaturalist.org/v1/docs/

Evidence is archived per photo in `sources/inaturalist/photos`, with source
IDs, original license metadata, timestamp and downloaded-byte hash. The app
bundles only verified local files; it does not stream images. Authors and
observation links are retained even for CC0. Human review of taxon identity,
visual quality and photo-specific markers is still required.

Habitat and vegetation attributes returned by the API describe the Brazilian
distribution; they are not state-specific occurrence proofs. The profile labels
these as national attributes. Native state membership is filtered separately.
