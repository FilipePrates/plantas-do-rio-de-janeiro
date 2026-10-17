# Registros de conservação e UCs do Rio

Revisão humana aprovada pelo usuário em 17/10/2026, após esta importação;
confirmação em `sources/editorial/human-review-2026-10-17.json`.

Importação em 17/10/2026: **201 espécies em 152 fichas**, **1.365 relações
espécie–UC**, **18 espécies com categoria histórica**. As espécies dos grupos
Anthurium e Philodendron mantêm seus próprios registros; uma categoria nunca
é atribuída ao gênero inteiro.

## Fonte utilizada

Maurenza, D.; Bocayuva, M.; Pougy, N.; Martins, E.; Martinelli, G. (2018).
*Lista da Flora das Unidades de Conservação Estaduais do Rio de Janeiro*.
JBRJ/CNCFlora, SEA, INEA, FUNBIO. 420 páginas impressas / 422 páginas no PDF.

- [PDF publicado pelo INEA](https://www.inea.rj.gov.br/wp-content/uploads/2019/09/Listas-das-UCs.pdf)
- [Conjunto de dados JBRJ, com licença Creative Commons Attribution](https://ckan.jbrj.gov.br/dataset/ucsestaduaisrj)
- [Registro bibliográfico JBRJ](https://dspace.jbrj.gov.br/jspui/handle/doc/96)

O catálogo solicitado (`florariojaneiro.jbrj.gov.br`) devolveu HTTP 403, inclusive
no [link direto fornecido pelo usuário](https://florariojaneiro.jbrj.gov.br/visualizar.php?id=17126&tipo=genero&ret=%2Fconsultaresultado.php).
Esse link usa `tipo=genero`: não seria correto atribuir seus registros a cada
espécie sem verificar os dados. Não houve importação direta desse catálogo.
O PDF é uma fonte oficial complementar, não uma cópia atual da base online.

## Significado dos campos

- **UCs:** nomes, vouchers/referências e páginas de ocorrência da publicação.
  Há 31 capítulos com listas, embora o estudo tenha considerado 36 UCs; cinco
  não receberam lista por falta ou escassez de registros (p. 16 impressa).
- **Conservação:** a coluna das tabelas cita a **Portaria MMA 443/2014**.
  `referenceYear: 2014` é o ano da lista, não o da avaliação individual nem o
  ano de consulta. A interface informa explicitamente que a categoria é
  histórica. Não é uma declaração sobre a lista legal ou avaliação atual.
  Célula vazia não vira LC, NE ou “não ameaçada”.
- **Endemismo:** importado somente quando o nome traz `*` ou `**`, conforme a
  legenda. A ausência de asterisco não é convertida em `false`; continua sem
  dado. `**` não fornece sozinho uma categoria de ameaça.
- **Município:** o rótulo pertence à UC. Quatro introduções localizam a unidade
  inteiramente na cidade: Chacrinha, Pedra Branca, Grajaú e Guaratiba. As páginas
  de evidência são preservadas. 82 espécies têm registro em alguma dessas UCs.
  Nenhuma UC que atravessa municípios transfere todos eles à espécie.
  O campo `geography` do catálogo permanece inalterado: a publicação admite
  registros de áreas adjacentes e limitações de identificação (pp. 15–16).
- **Limites:** a fonte compila registros consultados até outubro de 2017; não
  prova presença atual nem ausência nas outras áreas. Vegetação da UC não foi
  atribuída automaticamente a todas as suas plantas. Não foram importadas
  coordenadas, mapas ou fotografias do PDF.

## Correspondência e reprodução

`regionalEvidence` é opcional no esquema compartilhado com o editor. Cada
registro identifica exatamente uma espécie da ficha ou um membro enumerado
do grupo, com fonte, ano de publicação, UCs e avaliações independentes.
Catálogos antigos continuam válidos e o campo sobrevive ao import/export.

Foram aceitos somente binômio e família exatos. Não se aplicaram sinonímias,
correções ortográficas ou avaliações de variedades/subespécies à espécie toda.
Por isso, por exemplo, nomes antigos de Pleroma e grafias alternativas de
Psidium não foram ligados automaticamente. Os 34 nomes sem correspondência
estão no relatório; isso não demonstra ausência em UC.

O arquivo `sources/rio-conservation/uc-flora-2018.json` preserva linhas factuais
extraídas, seções, URLs, data, licença declarada e SHA-256 do PDF. As páginas
armazenadas são as do **PDF, começando em 1**, para que os links `#page=` abram
o lugar correto. Não há dependência de rede para ler os dados no aplicativo.

Para reproduzir, baixe o PDF acima e execute, com `pdftotext` instalado:

```sh
python3 scripts/import_rio_uc.py /caminho/Listas-das-UCs.pdf
python3 scripts/import_rio_uc.py /caminho/Listas-das-UCs.pdf --apply
npx tsc --noEmit
npm test
npm run catalog:check
npm run editor:sync
```

A primeira chamada é uma prévia. A segunda substitui apenas evidências desta
fonte e mantém as demais, fotos, categorias, membros e abrangências. O importador
recusa documentos com quantidade de páginas ou capítulos inesperada. Todos os
novos textos e registros entraram como rascunho e foram posteriormente
aprovados pelo usuário, conforme a confirmação acima.
