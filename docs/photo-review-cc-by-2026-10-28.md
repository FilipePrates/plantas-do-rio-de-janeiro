# Revisão de fotos CC BY — 2026-10-28

Adicionadas **112 fotos CC BY 4.0 a 43 fichas antes sem fotos**. O catálogo agora tem 437 fotos (325 CC0 + 112 CC BY), 186 fichas com fotos e 125 sem fotos. Mantidos 311 registros, 452 espécies representadas, 123 perfis e 188 referências. Adicionar imagens não promove uma referência a perfil completo.

Todos os textos, estados de revisão e fotos existentes foram comparados ao catálogo anterior e permaneceram iguais. As novas fotos estão em `draft`, com `markers: ["unknown"]`; a triagem visual pelo assistente não substitui revisão humana de identidade e marcadores.

## Licença e crédito

CC BY 4.0 permite reprodução, redistribuição e adaptação, inclusive comercial, desde que se preserve a atribuição, se vincule a licença e se indiquem alterações. Não aplicar restrições adicionais à fotografia nem sugerir endosso. A licença declarada não garante por si só que o remetente detém os direitos. Fonte: [Creative Commons — CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

A autorização do usuário para esta rodada amplia a política anterior CC0. Apenas `cc0` e `cc-by` no nível da foto são aceitos. NC, SA, ND e `default_photo` permanecem excluídos. A correspondência do código `cc-by` à versão 4.0 foi verificada no [módulo de licenças do próprio iNaturalist](https://github.com/inaturalist/inaturalist/blob/main/app/models/shared/license_module.rb) e arquivada em `sources/inaturalist/license-policy-2026-10-28.json` e no arquivo Ruby com hash.

Cada aquisição preserva o objeto da foto, atribuição integral, autor derivado desse crédito (não presumido a partir do observador), links da foto/observação/licença, data e SHA-256. App e editor mostram a licença correta. O painel de créditos explica o redimensionamento/recorte das miniaturas. O importador compara os créditos exportados com a evidência arquivada, além dos hashes.

## Método e limites

Buscadas as 168 fichas que ainda não tinham fotos, com `photo_license=cc-by`, nome científico exato, até 30 observações ordenadas por votos, rejeitando fotos ocultas, sinalizadas ou menores que 400 pixels em qualquer dimensão. A primeira busca priorizou grau de pesquisa e indivíduos não marcados como cultivados; uma segunda busca ampliou os graus de qualidade para as fichas restantes. Isso é uma busca delimitada, não prova de inexistência de outras imagens.

Foram selecionadas 95 fotos de observações com grau de pesquisa e 17 de observações `needs_id`. Estas 17 recebem aviso na legenda. Nenhuma observação selecionada está marcada como cultivada pela API; isso não comprova condição silvestre (por exemplo, Paratecoma foi fotografada em jardim botânico). Local da foto não altera a evidência de ocorrência municipal da ficha.

As 125 fichas restantes permanecem sem foto. Incluem três resultados com divergência de nomes que exigem investigação taxonômica; não houve substituição automática de espécie. Há conjuntos limitados a casca/raízes, folhas ou vistas distantes. Allagoptera caudescens recebe aviso específico para conferir identidade e estágio de desenvolvimento. Cariniana ianeirensis, Cattleya guttata, Scutia arenicola e Cupania schizoneura receberam uma única foto útil; outras imagens eram ausentes ou quase duplicadas.

## Revisar no editor

1. Exporte qualquer trabalho novo do navegador antes de importar a versão sincronizada.
2. Use **Importar JSON** com `/home/filipe/Desktop/plantas-rio-content-editor/public/catalog.json`. A sincronização não substitui rascunhos já salvos no navegador.
3. Busque as espécies da tabela. Confira identidade, partes visíveis, legenda e direitos; atribua marcadores por foto, revise foto e texto separadamente e use **Salvar ficha**.
4. Exporte e faça a prévia pelo `npm run catalog:import -- /caminho/export.json`; depois aplique com `--apply` quando o lote estiver correto.

## Seleção por espécie

| Espécie | Fotos adicionadas | Pontos para revisão visual |
| --- | --- | --- |
| Allagoptera caudescens | [629772737](https://www.inaturalist.org/photos/629772737), [629772679](https://www.inaturalist.org/photos/629772679), [629772710](https://www.inaturalist.org/photos/629772710) | Porte e folhas de indivíduo baixo; conferir identidade e estágio de desenvolvimento. Frutos ainda presos à planta. Frutos de perto; conferir associação ao indivíduo. |
| Attalea humilis | [590256847](https://www.inaturalist.org/photos/590256847), [590256760](https://www.inaturalist.org/photos/590256760), [60788855](https://www.inaturalist.org/photos/60788855) | Porte e disposição das folhas. Inflorescência em vista próxima. Cacho de frutos junto à base. |
| Geonoma elegans | [675738974](https://www.inaturalist.org/photos/675738974), [325995697](https://www.inaturalist.org/photos/325995697) | Folhas e eixo reprodutivo em vista próxima. Detalhe das folhas e sua divisão. |
| Geonoma pohliana | [438795777](https://www.inaturalist.org/photos/438795777), [154241157](https://www.inaturalist.org/photos/154241157), [154241133](https://www.inaturalist.org/photos/154241133) | Folha e divisão dos segmentos. Cacho de frutos. Eixo reprodutivo com pequenas flores; conferir estrutura na revisão. |
| Sparattosperma leucanthum | [604167788](https://www.inaturalist.org/photos/604167788), [144981918](https://www.inaturalist.org/photos/144981918), [720985383](https://www.inaturalist.org/photos/720985383) | Flor de frente. Folha composta e disposição dos folíolos. Frutos alongados ainda presos ao ramo. |
| Alcantarea regina | [247997623](https://www.inaturalist.org/photos/247997623), [285292454](https://www.inaturalist.org/photos/285292454) | Porte da roseta e haste reprodutiva no afloramento; faltam detalhes próximos. Rosetas no substrato rochoso; vista de hábito e ambiente. |
| Clusia hilariana | [47463267](https://www.inaturalist.org/photos/47463267), [629263545](https://www.inaturalist.org/photos/629263545), [584075431](https://www.inaturalist.org/photos/584075431) | Flor em vista frontal e folhas. Fruto aberto. Ramo com folhas, botões e flor; conferir variação floral na revisão. |
| Nidularium fulgens | [51767008](https://www.inaturalist.org/photos/51767008), [115647460](https://www.inaturalist.org/photos/115647460), [734038011](https://www.inaturalist.org/photos/734038011) | Roseta e brácteas coloridas. Flores tubulares em vista próxima. Folhas, margem e roseta vegetativa. |
| Nematanthus brasiliensis | [415767793](https://www.inaturalist.org/photos/415767793), [415767824](https://www.inaturalist.org/photos/415767824), [415767764](https://www.inaturalist.org/photos/415767764) | Flor de perfil, tubo e cálice. Flor vista pela abertura. Ramos pendentes e folhas no suporte. |
| Copaifera langsdorffii | [617370818](https://www.inaturalist.org/photos/617370818), [572130082](https://www.inaturalist.org/photos/572130082), [621635117](https://www.inaturalist.org/photos/621635117) | Ramo com folhas e inflorescência. Fruto aberto e semente com arilo. Casca do tronco. |
| Sinningia speciosa | [721458074](https://www.inaturalist.org/photos/721458074), [577882109](https://www.inaturalist.org/photos/577882109), [577882105](https://www.inaturalist.org/photos/577882105) | Folhas e flor de perfil. Abertura da flor em vista próxima. Porte e substrato do indivíduo. |
| Nectandra membranacea | [262288020](https://www.inaturalist.org/photos/262288020), [320587636](https://www.inaturalist.org/photos/320587636), [323881800](https://www.inaturalist.org/photos/323881800) | Inflorescência e flores pequenas. Folhas e nervação. Porte e copa. |
| Ocotea odorifera | [279140120](https://www.inaturalist.org/photos/279140120), [356639936](https://www.inaturalist.org/photos/356639936), [279140945](https://www.inaturalist.org/photos/279140945) | Face superior e disposição das folhas. Face inferior das folhas. Ápice do ramo e gema. |
| Cariniana ianeirensis | [44510233](https://www.inaturalist.org/photos/44510233) | Frutos e sementes; única foto elegível encontrada, sem detalhes vegetativos. |
| Lecythis lanceolata | [476879261](https://www.inaturalist.org/photos/476879261), [476879255](https://www.inaturalist.org/photos/476879255), [476879258](https://www.inaturalist.org/photos/476879258) | Fruto aberto preso à árvore. Folhas e ramos. Fruto fechado entre a folhagem. |
| Miconia cinnamomifolia | [598543422](https://www.inaturalist.org/photos/598543422), [280944675](https://www.inaturalist.org/photos/280944675), [536760623](https://www.inaturalist.org/photos/536760623) | Frutos e nervação foliar. Casca do tronco. Folha, ápice e nós do ramo. |
| Pleroma trichopodum | [364636996](https://www.inaturalist.org/photos/364636996), [462905012](https://www.inaturalist.org/photos/462905012), [462904961](https://www.inaturalist.org/photos/462904961) | Flor de frente e folhas. Face inferior das folhas e pelos do ramo. Porte do indivíduo florido. |
| Ficus cyclophylla | [168876097](https://www.inaturalist.org/photos/168876097), [166329845](https://www.inaturalist.org/photos/166329845) | Base, tronco e raízes aéreas; faltam folhas e sicônios próximos. Detalhe das raízes aéreas; não distingue a espécie sozinho. |
| Campomanesia guaviroba | [536839161](https://www.inaturalist.org/photos/536839161), [536839156](https://www.inaturalist.org/photos/536839156), [265243979](https://www.inaturalist.org/photos/265243979) | Face superior e disposição das folhas. Face inferior das folhas. Fruto e ramo em vista próxima. |
| Cattleya guttata | [347194342](https://www.inaturalist.org/photos/347194342) | Planta epífita florida; única vista útil do conjunto, com detalhe limitado das flores. |
| Manilkara subsericea | [598549641](https://www.inaturalist.org/photos/598549641), [423530622](https://www.inaturalist.org/photos/423530622), [341159009](https://www.inaturalist.org/photos/341159009) | Frutos maduros presos ao ramo. Flores pequenas em vista próxima. Folhas e contraste entre suas faces. |
| Aspidosperma parvifolium | [598888724](https://www.inaturalist.org/photos/598888724), [598888918](https://www.inaturalist.org/photos/598888918), [598888962](https://www.inaturalist.org/photos/598888962) | Flores pequenas e ramo. Face externa do fruto. Interior do fruto aberto. |
| Tabebuia cassinoides | [60927236](https://www.inaturalist.org/photos/60927236), [410540697](https://www.inaturalist.org/photos/410540697), [410540913](https://www.inaturalist.org/photos/410540913) | Flor de frente. Face superior e disposição das folhas. Face inferior e nervação das folhas. |
| Inga maritima | [150444248](https://www.inaturalist.org/photos/150444248), [150444228](https://www.inaturalist.org/photos/150444228), [150444217](https://www.inaturalist.org/photos/150444217) | Inflorescências de perto. Folha composta, raque e folíolos. Porte e ramificação do indivíduo florido. |
| Vanhouttea gardneri | [148821244](https://www.inaturalist.org/photos/148821244), [148821278](https://www.inaturalist.org/photos/148821278), [148821166](https://www.inaturalist.org/photos/148821166) | Face superior das folhas e flor. Face inferior das folhas. Flor tubular de perfil. |
| Byrsonima microphylla | [510283868](https://www.inaturalist.org/photos/510283868), [507992542](https://www.inaturalist.org/photos/507992542), [510283876](https://www.inaturalist.org/photos/510283876) | Flores e inflorescência. Frutos maduros. Forma e disposição das folhas. |
| Meriania glabra | [57914400](https://www.inaturalist.org/photos/57914400), [353391566](https://www.inaturalist.org/photos/353391566), [353391554](https://www.inaturalist.org/photos/353391554) | Flor de frente e botões. Folhas e nervação. Porte e disposição dos ramos. |
| Virola bicuhyba | [548624053](https://www.inaturalist.org/photos/548624053), [236874847](https://www.inaturalist.org/photos/236874847), [368809280](https://www.inaturalist.org/photos/368809280) | Fruto aberto e arilo. Folhas e disposição no ramo. Casca do tronco. |
| Myrceugenia myrcioides | [356629737](https://www.inaturalist.org/photos/356629737), [277741151](https://www.inaturalist.org/photos/277741151), [277741157](https://www.inaturalist.org/photos/277741157) | Ramos com flores e botões. Face inferior e disposição das folhas. Casca de ramo lenhoso. |
| Pimenta pseudocaryophyllus | [656585420](https://www.inaturalist.org/photos/656585420), [341370105](https://www.inaturalist.org/photos/341370105), [341370109](https://www.inaturalist.org/photos/341370109) | Frutos e folhas no ramo. Face inferior e nervura da folha. Face superior da folha. |
| Podocarpus sellowii | [424581234](https://www.inaturalist.org/photos/424581234), [424581237](https://www.inaturalist.org/photos/424581237), [424580724](https://www.inaturalist.org/photos/424580724) | Folhas e sua disposição no ramo. Outro ângulo das folhas. Tronco e brotação; faltam estruturas reprodutivas. |
| Rhamnidium glabrum | [677889429](https://www.inaturalist.org/photos/677889429), [677889322](https://www.inaturalist.org/photos/677889322), [677889334](https://www.inaturalist.org/photos/677889334) | Face inferior das folhas e casca. Frutos e face superior das folhas. Disposição das folhas e frutos no ramo. |
| Scutia arenicola | [264300010](https://www.inaturalist.org/photos/264300010) | Frutos maduros e folhas; a outra foto é quase idêntica. |
| Faramea calyciflora | [727944299](https://www.inaturalist.org/photos/727944299), [727944186](https://www.inaturalist.org/photos/727944186), [727944225](https://www.inaturalist.org/photos/727944225) | Flores em vista próxima e folhas. Disposição das folhas e inflorescência. Hábito do indivíduo florido. |
| Melanopsidium nigrum | [629070197](https://www.inaturalist.org/photos/629070197), [629070219](https://www.inaturalist.org/photos/629070219) | Frutos e folhas no ramo. Porte e ramificação. |
| Syagrus weddelliana | [748438567](https://www.inaturalist.org/photos/748438567), [611013912](https://www.inaturalist.org/photos/611013912) | Porte e disposição das folhas; faltam flores e frutos próximos. Copa e folhas, em outro indivíduo. |
| Dendropanax heterophyllus | [752838265](https://www.inaturalist.org/photos/752838265), [752838415](https://www.inaturalist.org/photos/752838415) | Flores em vista próxima. Folhas e disposição no ramo. |
| Cololobus rupestris | [340233662](https://www.inaturalist.org/photos/340233662), [340233673](https://www.inaturalist.org/photos/340233673), [340233667](https://www.inaturalist.org/photos/340233667) | Inflorescência de perto. Folhas e nervação. Porte junto à rocha. |
| Paratecoma peroba | [606653777](https://www.inaturalist.org/photos/606653777), [606653764](https://www.inaturalist.org/photos/606653764) | Casca de perto; indivíduo cultivado, faltam folhas e frutos. Porte do tronco. |
| Myrceugenia cucullata | [675558294](https://www.inaturalist.org/photos/675558294), [675558314](https://www.inaturalist.org/photos/675558314) | Face superior das folhas. Face inferior das folhas. |
| Myrceugenia miersiana | [448736363](https://www.inaturalist.org/photos/448736363), [448737585](https://www.inaturalist.org/photos/448737585) | Face inferior e nervação foliar. Folhas e disposição no ramo. |
| Psychotria subspathacea | [691168057](https://www.inaturalist.org/photos/691168057), [691168162](https://www.inaturalist.org/photos/691168162), [691168124](https://www.inaturalist.org/photos/691168124) | Estrutura reprodutiva e folhas; conferir sua interpretação na revisão. Face inferior e nervação da folha. Porte do arbusto. |
| Cupania schizoneura | [609929978](https://www.inaturalist.org/photos/609929978) | Folha composta e margens dos folíolos; única foto elegível encontrada. |

## Arquivos de auditoria

- `sources/inaturalist/coverage-cc-by-2026-10-28/catalog-before.json`: estado anterior.
- `survey.json`, `survey-expanded.json` e pastas `responses/`, `responses-expanded/`: consultas, respostas, datas, hashes e candidatos.
- `selected-photos.json`: relação entre foto, observação, qualidade e justificativa visual.
- `summary.json`: contagens e resultado da comparação de preservação.
- `sources/inaturalist/photos/<id>.json`: licença e hash de cada imagem adquirida.

As duas divergências preexistentes entre Spondias venulosa e fotos identificadas como Spondias mombin permanecem para revisão. Esta rodada não as alterou.

## Validação executada

- App: `npx tsc --noEmit`, 29 testes e `npm run catalog:check` passaram; miniaturas e manifestos regenerados.
- Editor: TypeScript e testes passaram, incluindo atribuição de autor diferente do observador, cache imutável e rejeição de NC/SA/ND.
- Navegador isolado: crédito CC BY, atribuição integral e aviso de alterações conferidos no perfil e na foto ampliada; salvar/exportar no editor preservou todos os campos das fotos. O JSON exportado passou na prévia de importação do app.
- Comparação com o catálogo anterior confirmou preservação de todos os campos e fotos existentes; hashes das aquisições e respostas de busca foram verificados.
- Catálogo e fotos finais sincronizados no editor. Nenhum APK foi gerado e nenhuma instalação em dispositivo foi executada.
