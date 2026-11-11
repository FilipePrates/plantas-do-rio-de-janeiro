# Seleção por imagens e espaço — 11/11/2026

A planilha original tem **3.114 espécies**, não 3.114 conjuntos fotográficos
prontos. Nesta segunda rodada, a planilha fornecida foi aceita como autoridade
para o estado do Rio de Janeiro, por orientação do usuário. Não houve nova
pesquisa de ocorrência estadual. A seleção priorizou imagens claras e atraentes,
direitos reutilizáveis e texto botânico suficiente, com teto de 10 MiB de novos
originais. O limite do catálogo continua sendo 1.500 espécies representadas.

| Medida | Antes | Depois |
| --- | ---: | ---: |
| Espécies representadas | 480 | 493 |
| Entradas no catálogo | 359 | 372 |
| Fichas ilustradas | 181 | 210 |
| Entradas de referência | 178 | 162 |
| Fotografias | 577 | 599 |

Foram preparadas **29 fichas ilustradas**: 16 entradas de referência ganharam
textos próprios e uma ordem de fotos mais informativa, usando apenas imagens
já disponíveis; 13 espécies da planilha ganharam fichas novas. Os 22 originais
novos somam **10.365.783 bytes (9,89 MiB)**, mais miniaturas pequenas geradas.
Uma segunda vista semelhante de Stifftia fruticosa foi omitida para manter
diversidade dentro desse teto. Sua evidência permanece no arquivo de pesquisa;
a imagem alternativa fica apenas no backup, fora dos módulos do aplicativo.

## Novas espécies

- Chrysobalanus icaco — abajeru: fruto e planta.
- Jacaratia spinosa — jaracatiá: frutos na copa e folha composta.
- Carpotroche brasiliensis — sapucainha: fruto aberto e frutos nos ramos.
- Centrolobium tomentosum — araribá: sâmara e floração.
- Swartzia langsdorffii — banana-de-papagaio: flor e interior do fruto.
- Erythrina verna — mulungu: copa florida.
- Pleroma heteromallum — orelha-de-onça: folhas e flores.
- Solanum cernuum — braço-de-preguiça: inflorescência e planta.
- Brunfelsia pauciflora — manacá: flor e folhagem no mesmo enquadramento.
- Pavonia multiflora — pavônia: epicálice e conjunto da planta.
- Stifftia chrysantha — esponja-de-ouro: detalhe e ramo com capítulo.
- Stifftia fruticosa — esponjeira: capítulo e folhagem.
- Eriotheca pentaphylla — imbiruçu-branco: detalhe floral.

## Referências transformadas em fichas

Geonoma elegans; G. pohliana; Sparattosperma leucanthum; Clusia hilariana;
Sinningia speciosa; Lecythis lanceolata; Inga maritima; Virola bicuhyba;
Cololobus rupestris; Bathysa australis; Myrceugenia myrcioides;
Byrsonima microphylla; Tabebuia cassinoides; Avicennia schaueriana;
Melanopsidium nigrum; Nematanthus brasiliensis.

## Qualidade e rastreabilidade

Os textos são redações originais em português, com fontes botânicas vinculadas
a cada ficha. Os caracteres servem para reconhecimento inicial e comparação;
não foram inventadas chaves completas, comestibilidade, usos terapêuticos ou
categorias atuais de ameaça. Em Stifftia, o pápus colorido foi distinguido da
corola; em Pavonia, o epicálice é importante para evitar confusão no cultivo.

Fotos novas vieram de observações de grau de pesquisa com nome exato e licença
**da fotografia** CC0 ou CC BY. O importador do editor de plantas reconferiu
identificação e direitos, arquivou evidências e calculou SHA256. Textos e fotos
novos continuam em **rascunho**. Marcadores novos continuam `unknown`, sem
inferência a partir de anotações da observação. As fotografias anteriores
conservam seus objetos de metadados completos, inclusive revisão e legendas.

Espécies novas mantêm `rio-state`; nenhuma foi promovida a ocorrência municipal.
Atributos de ambiente da planilha têm abrangência brasileira e assim aparecem
nos textos. A planilha original permanece intacta, SHA256
`cc0b057a2215cbde4d70758eb75d355ac26bb6a64357d946d55b5f8bb1b89bb5`.
As ressalvas taxonômicas anteriores de Philodendron foram preservadas.

## Arquivos

- [Cobertura das 3.114 linhas e fotos selecionadas](photo-selection-2026-11-11.xlsx).
- [Cobertura em CSV](photo-selection-2026-11-11.csv).
- [Auditoria e fontes por espécie](photo-selection-2026-11-11.json).
- `sources/photo-selection-2026-11-11/`: catálogo anterior, pesquisa de fotos,
  seleção, rascunho intermediário e auditoria final.
- `scripts/photo_selection_texts.py`: textos, fontes e fotos selecionadas.
- `scripts/curate_photo_selection.py`: aplicação com comparação de baseline,
  preservação de fotos anteriores e limite de bytes.
- `scripts/import_photo_selection.mjs`: importação verificada e retomável.

O editor de plantas foi sincronizado. Este é conteúdo de desenvolvimento para
o APK de teste solicitado; a revisão humana continua pendente antes de lançamento.
O [APK de teste foi construído e verificado](apk-test-2026-11-11.md).

## Validação

- TypeScript sem erros no aplicativo e no editor.
- Aplicativo: 39 testes aprovados. Editor: 9 testes aprovados.
- `catalog:check`: 372 entradas e 493 espécies; direitos, evidências e hashes
  dos 599 originais e das miniaturas validados.
- As entradas fora desta seleção permaneceram iguais ao baseline da rodada;
  todas as fotos anteriores conservaram seus objetos de metadados.
- Planilha exportada: pacote XML/ZIP válido e todas as 3.114 linhas preservadas.
- Persistem os dois avisos anteriores de Spondias venulosa com nome de
  observação S. mombin (fotos 625050388 e 210428107). Esta rodada não alterou
  essas imagens ou sua identificação; a conciliação continua pendente.
