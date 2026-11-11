"""Original, bounded Portuguese drafts for the image-led workbook pass.

Sources support recognition, not municipal distribution or food/medical advice.
Photographs are illustrations; no photo tags or review approvals are inferred.
"""
SOURCES = {
    'geonoma': ('Henderson (2011). A revision of Geonoma (Arecaceae). Phytotaxa 17. Morfologia e variação.', 'https://phytotaxa.mapress.com/pt/article/download/phytotaxa.17.1.1/21492'),
    'sparattosperma': ('Flora Neotropica / Flora do Brasil: Sparattosperma leucanthum. Descrição disponibilizada no World Flora Online.', 'https://www.worldfloraonline.org/taxon/wfo-0000779743'),
    'clusia': ('Flora of Espírito Santo: Clusiaceae (2023). Tratamento morfológico.', 'https://www.scielo.br/j/rod/a/4qY5t4CNsZ8VZmVDSs5yYNS/?lang=en'),
    'sinningia': ('Flora do Brasil: Sinningia speciosa. Morfologia disponibilizada no World Flora Online.', 'https://www.worldfloraonline.org/taxon/wfo-0000497309'),
    'lecythis': ('ESALQ/USP. Lecythis lanceolata, sapucaia-branca. Caracterização botânica.', 'https://www.esalq.usp.br/d-plant/node/2730'),
    'inga': ('Flora of Espírito Santo: Inga (2022). Chave e descrição de Inga maritima.', 'https://www.scielo.br/j/rod/a/J9wnpXNpYJqxbNqdrszhL5k/'),
    'virola': ('Quintanilha & Lobão (2017). Flora do Rio de Janeiro: Myristicaceae. Chave e descrições.', 'https://www.scielo.br/j/rod/a/9bRBWGnwM5sBKfpYCf4QynN/?format=html&lang=pt'),
    'cololobus': ('CNCFlora/JBRJ (2012). Cololobus rupestris. Caracteres morfológicos; categoria histórica não transposta para a ficha.', 'https://proflora.jbrj.gov.br/html/Cololobus%20rupestris_2012.html'),
    'bathysa': ('Rubiaceae da Serra Negra, Minas Gerais, Brasil (2014). Descrição e reconhecimento de Bathysa australis.', 'https://www.scielo.br/j/rod/a/ZX87WGG48FqVwtrY4FqSwKD/?format=html&lang=pt'),
    'myrceugenia': ('Wagner & Fiaschi (2020). Myrtaceae from the Atlantic forest subtropical highlands of São Joaquim National Park. Morfologia.', 'https://www.scielo.br/j/rod/a/dsHSX9ZcDJwNZcG88VGZR6R/?format=html'),
    'byrsonima': ('Biologia reprodutiva de espécies simpátricas de Malpighiaceae em dunas costeiras da Bahia (2006). Morfologia floral e visitantes.', 'https://www.scielo.br/j/rbb/a/JxFxDx3zFTR4xqLYhSTXBcx/?lang=pt'),
    'caixeta': ('Carvalho (2003). Caixeta: Tabebuia cassinoides. Espécies Arbóreas Brasileiras, Embrapa Florestas.', 'https://www.alice.cnptia.embrapa.br/alice/bitstream/doc/1139717/1/Especies-Arboreas-Brasileiras-vol-1-Caixeta.pdf'),
    'avicennia': ('Acanthaceae no Parque Estadual Restinga de Bertioga (2019). Tratamento de Avicennia schaueriana.', 'https://www.scielo.br/j/hoehnea/a/nH8vVJMgVnz9Fjp79JN3VBK'),
    'melanopsidium': ('Gomes et al. (2026). Propagação de Melanopsidium nigrum como estratégia de resgate de germoplasma. UENF/UFRJ/GNA/Reserva Caruara.', 'https://esg.gna.com.br/assets/documents/documentos_balizadores/11_artigos/boletim-melanopsidium-nigrum.pdf'),
    'nematanthus': ('Wiehler & Chautems. Nematanthus: caracteres do gênero. Reimpresso em The Gloxinian, 3º trimestre de 2003.', 'https://www.gesneriadsociety.org/wp-content/uploads/2016/08/Glox-3rd-qtr-03.pdf'),
    'icaco': ('University of Florida/IFAS. Cocoplum (Chrysobalanus icaco): Identification and Uses. Morfologia.', 'https://ask.ifas.ufl.edu/publication/EP553'),
    'jacaratia': ('Carvalho (2006). Jaracatiá: Jacaratia spinosa. Espécies Arbóreas Brasileiras 2. Embrapa Florestas.', 'https://ainfo.cnptia.embrapa.br/digital/bitstream/item/232466/1/Especies-Arboreas-Brasileiras-vol-2-Jaracatia.pdf'),
    'carpotroche': ('Ácidos ciclopentênicos do óleo da sapucainha (2009). Química Nova 32. Introdução: morfologia dos frutos; usos terapêuticos históricos não adotados.', 'https://www.scielo.br/j/qn/a/JLcPtLQf9HbWPVDsXqqp8Ht/?lang=pt'),
    'centrolobium': ('Jardim Botânico/UFSM (2018). Araribá: Centrolobium tomentosum. Caracterização de folhas, flores e sâmaras.', 'https://www.ufsm.br/orgaos-suplementares/jardim-botanico/2018/05/08/arariba-jardim-botanico'),
    'swartzia': ('Lima (1995). Leguminosas da Flora Fluminensis de Vellozo. Acta Botanica Brasilica 9. Caracteres de Swartzia langsdorffii.', 'https://www.scielo.br/j/abb/a/8p9bCGNGnHPPjMHV5Ln5kFg/?format=pdf&lang=pt'),
    'swartzia-fruit': ('Physical and chemical evaluation of Swartzia langsdorffii fruits (2025). Brazilian Journal of Food Technology. Morfologia e ausência de evidência de uso alimentar humano.', 'https://www.scielo.br/j/bjft/a/6HvmWD73zbKzWqtjJVxhRVx/?format=html'),
    'erythrina': ('Parrini & Raposo (2008). Associação entre aves e flores de duas espécies de Erythrina na Mata Atlântica. Observações de campo.', 'https://www.scielo.br/scielo.php?lng=en&nrm=iso&pid=S0073-47212008000100015&script=sci_arttext&tlng=pt'),
    'pleroma': ('Embrapa (2021). Documentos 501, p. 76: Pleroma heteromallum. Caracterização botânica.', 'https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/1133904/1/Cpact-Documento-501.pdf'),
    'solanum': ('Lafetá (2002). Espécies lenhosas de Solanum (Solanaceae) na Reserva Biológica de Santa Cândida, Juiz de Fora, Minas Gerais. Hoehnea 29:133–149. Descrição de S. cernuum.', 'https://smastr16.blob.core.windows.net/hoehnea/2015/07/292_T07_20_07_2015.pdf'),
    'brunfelsia': ('Flora do Brasil 2020. Brunfelsia: descrição de B. pauciflora. JBRJ.', 'https://monografiasfloradobrasil.jbrj.gov.br/brunfelsia.pdf'),
    'pavonia': ('Flora Mesoamericana: Pavonia multiflora. Morfologia disponibilizada no World Flora Online.', 'https://www.worldfloraonline.org/taxon/wfo-0001077946'),
    'stifftia': ('Roque (2020). Stifftieae. Flora do Brasil 2020, JBRJ. Descrições de Stifftia chrysantha e S. fruticosa.', 'https://monografiasfloradobrasil.jbrj.gov.br/stifftieae.pdf'),
    'stifftia-names': ('CNCFlora/JBRJ (2012). Stifftia fruticosa: nomes populares e caracteres. Categoria histórica não transposta para a ficha.', 'https://proflora.jbrj.gov.br/html/Stifftia%20fruticosa_2012.html'),
    'eriotheca': ('Duarte (2020). Eriotheca. Flora do Brasil 2020, JBRJ. Descrição de E. pentaphylla.', 'https://monografiasfloradobrasil.jbrj.gov.br/eriotheca.pdf'),
}

# scientific name | preferred common name (blank preserves existing) | description | recognition | sources
TEXT = '''
Geonoma elegans||Palmeira pequena de sub-bosque, com caules finos que podem formar touceiras. As folhas variam muito: podem parecer inteiras, com ponta bifurcada, ou apresentar divisões irregulares.|Observe o caule delgado e a forma variável da lâmina. A separação de outras Geonoma também exige examinar as brácteas que envolvem a inflorescência; uma folha pouco dividida, sozinha, não confirma a espécie.|geonoma
Geonoma pohliana||Palmeira de florestas com grande variação no porte e no recorte das folhas. A galeria reúne o aspecto da planta e os eixos reprodutivos, úteis para comparar esse conjunto de formas.|Compare a divisão das folhas, as brácteas e as ramificações da inflorescência. A revisão do gênero reconhece várias subespécies; estas fotografias não receberam uma identificação infraespecífica adicional.|geonoma
Sparattosperma leucanthum||Árvore de folhas divididas como os dedos de uma mão e flores claras, com bordas delicadamente recortadas. Os frutos são cápsulas compridas e estreitas, que liberam sementes aladas.|Procure folhas geralmente com cinco folíolos, flores brancas a rosadas com linhas na garganta e lobos de margem franjada. Compare também as cápsulas longas: a cor clara da flor, isoladamente, não basta para separá-la dos ipês.|sparattosperma
Clusia hilariana||Arbusto ou árvore de folhas espessas e flores vistosas, claras a rosadas. Os frutos se abrem em partes e expõem sementes envolvidas por arilos coloridos.|Compare as folhas opostas, de contorno obovado a oblanceolado, e a estrutura central das flores. Nas flores masculinas, os estames se unem em um cone; nos frutos permanece uma coroa de estigmas. Outras clúsias também têm folhas carnosas.|clusia
Sinningia speciosa||Erva tuberosa de flores grandes em forma de sino, conhecidas no cultivo como gloxínias. As folhas largas e pilosas contrastam com as corolas, que podem apresentar diferentes tons de lilás, roxo, rosa ou branco.|Observe as folhas opostas, de margem arredondadamente dentada, e a corola ampla, com tubo dilatado. O órgão subterrâneo tuberoso ajuda a caracterizar a planta; variedades e híbridos cultivados não devem ser identificados apenas pela cor.|sinningia
Lecythis lanceolata||Árvore conhecida como sapucaia-branca, com frutos lenhosos que lembram um recipiente com tampa. A galeria permite comparar o fruto aberto e a folhagem.|Observe folhas simples de contorno lanceolado e o fruto do tipo pixídio, que se abre pela tampa. O formato do recipiente e os caracteres das flores devem ser comparados com os de outras sapucaias; um fruto lenhoso não confirma sozinho a espécie.|lecythis
Inga maritima|Ingá-da-restinga|Arbusto ou arvoreta de restinga, com flores reunidas em espigas curtas e densas. Os muitos estames claros dão às inflorescências o aspecto de pequenas escovas.|Procure folhas com dois ou três pares de folíolos, eixo foliar alado e nectários entre os pares. A pilosidade dos ramos e da face inferior dos folíolos, junto às espigas congestionadas, ajuda a comparação com outros ingás.|inga
Virola bicuhyba|Bicuíba|Árvore de folhas estreitas e frutos que se abrem para expor uma semente envolvida por arilo. A frutificação oferece uma das vistas mais marcantes da espécie.|Compare folhas simples e alternas, estreitamente elípticas, com cerca de vinte a trinta pares de nervuras secundárias, e frutos elipsoides. Na chave fluminense, Virola gardneri apresenta folhas mais largas e menos pares de nervuras.|virola
Cololobus rupestris||Planta lenhosa de afloramentos rochosos, com capítulos de pequenas flores rosadas reunidos em conjuntos ramificados. A galeria mostra tanto as flores quanto o crescimento junto à rocha.|Observe folhas alternas, alongadas a mais largas na extremidade, ramos com pelos densos e pecíolo alado na base. Os capítulos contêm muitas flores pequenas; cada conjunto rosado não corresponde a uma única flor.|cololobus
Bathysa australis||Árvore que chama atenção pelas folhas muito grandes e pelas inflorescências amplas. Os ramos robustos e a pilosidade ajudam a reconhecer o conjunto no interior da floresta.|Procure ramos de seção quadrangular, grandes estípulas triangulares entre os pecíolos e folhas que podem ultrapassar quarenta centímetros. Nas inflorescências, as flores ficam agrupadas em pequenos conjuntos densos; compare esses caracteres em conjunto.|bathysa
Myrceugenia myrcioides||Arbusto ou árvore de folhas opostas e flores claras com numerosos estames. As bagas amadurecem em tons escuros e conservam as partes do cálice na extremidade.|Compare os ramos jovens achatados, as folhas elípticas a obovadas com nervura próxima da margem e uma a três flores por axila foliar. Há variação no tamanho e na pilosidade das folhas; a galeria não foi atribuída a uma variedade.|myrceugenia
Byrsonima microphylla||Espécie de restinga com flores pequenas e vistosas, reunidas em inflorescências alongadas. A galeria destaca a floração e os frutos carnosos em diferentes estágios.|Nas flores, observe as pétalas com base estreita e as glândulas produtoras de óleo no cálice, características importantes das malpighiáceas. Compare também folhas e frutos; cor da flor e tamanho da folha, isoladamente, não separam todas as espécies de Byrsonima.|byrsonima
Tabebuia cassinoides||Árvore associada a terrenos úmidos e alagadiços, conhecida como caixeta ou pau-de-tamanco. Produz flores tubulares claras e vistosas.|Observe as folhas simples e opostas, de consistência firme, junto às flores brancas com região interna amarelada. As folhas simples são uma diferença útil em relação a muitos ipês de folhas divididas, mas também ocorrem em outras espécies próximas.|caixeta
Avicennia schaueriana||Árvore de manguezal conhecida como mangue-preto. As folhas opostas e as raízes respiratórias que emergem do sedimento ajudam a reconhecer o gênero no ambiente.|Compare a face inferior clara das folhas e os conjuntos de flores pequenas. Para separá-la de A. germinans, o tratamento botânico usa também a seção do eixo da inflorescência e a distribuição de pelos na corola; raízes respiratórias não bastam.|avicennia
Melanopsidium nigrum||Planta lenhosa de restinga cujos frutos chamam atenção pelos sulcos longitudinais. A galeria permite observar o fruto ainda preso ao ramo e o aspecto da folhagem.|Compare as folhas opostas, as estípulas entre os pecíolos e a baga com costelas evidentes, visíveis nas imagens. Flores masculinas e femininas ocorrem em indivíduos distintos; o formato do fruto deve ser associado aos demais caracteres.|melanopsidium
Nematanthus brasiliensis||Gesneriácea de ramos com flores pendentes, sustentadas por pedicelos longos. A galeria destaca as corolas amarelas e avermelhadas e a abertura da flor.|Observe as folhas opostas e as flores suspensas abaixo dos ramos. A forma do tubo e da abertura da corola deve ser comparada com a de outros Nematanthus; pedicelos longos também ocorrem em outras espécies do gênero.|nematanthus
Chrysobalanus icaco|Abajeru|Arbusto ou pequena árvore de folhagem densa e frutos arredondados. Os frutos podem apresentar cores diferentes entre indivíduos, de claros e rosados a roxos escuros.|Compare as folhas simples, alternas, largas e coriáceas, com ápice arredondado ou discretamente entalhado. As flores são pequenas e claras; a identificação deve reunir folhas, flores e frutos, sem depender apenas da coloração destes.|icaco
Jacaratia spinosa|Jaracatiá|Árvore da família do mamoeiro, com tronco armado de acúleos e folhas divididas em folíolos que partem de um mesmo ponto. Os frutos alongados se tornam alaranjados.|Observe a folha composta palmada e os acúleos do caule. Ao contrário da lâmina profundamente recortada do mamoeiro comum, os folíolos do jaracatiá são unidades separadas. As fotografias mostram folhagem e frutos na copa.|jacaratia
Carpotroche brasiliensis|Sapucainha|Árvore com frutos grandes de casca rígida e projeções que lembram franjas ou babados. O aspecto incomum do fruto explica o nome popular fruta-de-babado.|Observe as cristas irregulares da casca e a polpa que envolve as sementes no fruto aberto. Compare também a folhagem e a inserção dos frutos nos ramos; a semelhança do nome sapucainha com sapucaia não indica parentesco próximo.|carpotroche
Centrolobium tomentosum|Araribá|Árvore de folhas compostas e flores amarelas a alaranjadas. O fruto é uma sâmara grande, com uma asa e a região que abriga as sementes protegida por projeções espinhosas.|Procure folhas alternas, pinadas, terminadas por um folíolo, e inflorescências nas pontas dos ramos. A combinação entre asa larga e núcleo espinhoso do fruto é especialmente útil para reconhecer Centrolobium; compare a pilosidade para chegar à espécie.|centrolobium
Swartzia langsdorffii|Banana-de-papagaio|Árvore com flores vistosas e frutos grandes que envolvem sementes em arilo carnoso. Esses frutos são consumidos pela fauna; o nome popular não estabelece comestibilidade para pessoas.|Compare as folhas compostas com eixo alado e folíolos elípticos a lanceolados. Os frutos são grandes e comprimidos, com arilo bem desenvolvido ao redor das sementes. A galeria mostra a flor e o interior do fruto.|swartzia,swartzia-fruit
Erythrina verna|Mulungu|Árvore cuja floração avermelhada pode se destacar acima da floresta, com muitos ramos expostos. As flores recebem visitas de aves que exploram seu néctar.|A imagem principal mostra a copa florida, útil para reconhecer o aspecto à distância. Para confirmar a espécie, é necessário comparar folhas, cálice e corola com outras Erythrina; várias árvores do gênero compartilham o nome mulungu e as flores vermelhas.|erythrina
Pleroma heteromallum|Orelha-de-onça|Arbusto de folhas grandes e aveludadas, com inflorescências de flores roxas acima da folhagem. O contraste entre pelos claros e pétalas coloridas torna a planta especialmente vistosa.|Observe folhas opostas, ovadas a cordiformes, com nervuras curvas partindo perto da base, e ramos inicialmente quadrangulares. A pilosidade esbranquiçada nas folhas e as flores agrupadas devem ser avaliadas em conjunto.|pleroma
Solanum cernuum|Braço-de-preguiça|Arbusto ou árvore pequena de folhas grandes, com a face inferior esbranquiçada. As inflorescências pendentes são cobertas por pelos densos, entre os quais aparecem pequenas flores brancas.|Procure folhas simples e alternas, inflorescências ramificadas que pendem dos ramos e o revestimento de pelos alongados. A corola branca tem forma de estrela; os frutos podem ficar parcialmente escondidos nesse revestimento.|solanum
Brunfelsia pauciflora|Manacá|Arbusto de flores grandes, com corola de tubo estreito e lobos largos e arredondados. As flores podem ser lilases ou brancas.|Compare folhas de contorno oblanceolado a obovado, inflorescências terminais e cálice tubular relativamente longo. Outros manacás do gênero têm aparência semelhante: a cor roxa ou branca, sozinha, não confirma a espécie.|brunfelsia
Pavonia multiflora|Pavônia|Arbusto cujo conjunto floral chama atenção pelas numerosas bractéolas estreitas, frequentemente rosadas ou avermelhadas. Essas estruturas envolvem o cálice e a corola tubular.|Conte e compare as bractéolas do epicálice: são numerosas e têm comprimentos diferentes. Pavonia × gledhillii pode ser confundida com esta espécie no cultivo; uma fotografia apenas da corola, sem o epicálice, não é suficiente para separá-las.|pavonia
Stifftia chrysantha|Esponja-de-ouro|Arbusto ou pequena árvore com capítulos vistosos e estruturas alaranjadas que lembram pincéis. O aspecto muda conforme as flores e os frutos se desenvolvem.|Observe folhas simples de margem inteira e os capítulos nas extremidades dos ramos. Parte do efeito de esponja vem do pápus, um conjunto de cerdas associado aos frutos, e não de pétalas compridas; compare os capítulos e o invólucro com os de outras Stifftia.|stifftia
Stifftia fruticosa|Esponjeira|Arbusto com capítulos que ganham um aspecto de pincel rosado a avermelhado. As folhas se concentram nas extremidades dos ramos.|Compare as folhas alongadas de margem inteira, os capítulos isolados ou em pequenos grupos e as brácteas do invólucro sobrepostas em várias séries. O pincel rosado é formado pelo pápus associado aos frutos; não corresponde à corola, descrita como amarela.|stifftia,stifftia-names
Eriotheca pentaphylla|Imbiruçu-branco|Árvore de folhas compostas palmadas e flores com muitos estames. Os frutos secos liberam sementes acompanhadas por fibras sedosas pardas.|Observe os folíolos que partem de um mesmo ponto, as pétalas sem enrolamento e o cálice campanulado com revestimento de aspecto ferrugíneo. Apesar do epíteto pentaphylla, o número de folíolos pode ser maior que cinco; ele não deve ser usado como critério único.|eriotheca
'''

NEW_PHOTOS = {
    'Chrysobalanus icaco': [97780, 191925073],
    'Jacaratia spinosa': [59867931, 505478464],
    'Carpotroche brasiliensis': [413153212, 707969943],
    'Centrolobium tomentosum': [429160847, 355062966],
    'Swartzia langsdorffii': [610223325, 556516392],
    'Erythrina verna': [740706335],
    'Pleroma heteromallum': [133410389, 157084663],
    'Solanum cernuum': [402581947, 52687324],
    'Brunfelsia pauciflora': [264323898],
    'Pavonia multiflora': [340017772, 505663252],
    'Stifftia chrysantha': [651787401, 736143011],
    'Stifftia fruticosa': [713847551],
    'Eriotheca pentaphylla': [676287054],
}

FIRST_PHOTO = {
    'Sparattosperma leucanthum': 604167788,
    'Clusia hilariana': 47463267,
    'Sinningia speciosa': 577882109,
    'Lecythis lanceolata': 476879261,
    'Inga maritima': 150444248,
    'Virola bicuhyba': 548624053,
    'Cololobus rupestris': 340233662,
    'Bathysa australis': 449371442,
    'Myrceugenia myrcioides': 356629737,
    'Byrsonima microphylla': 510283868,
    'Tabebuia cassinoides': 60927236,
    'Avicennia schaueriana': 750506760,
    'Melanopsidium nigrum': 629070197,
    'Nematanthus brasiliensis': 415767793,
}

def entries():
    result = {}
    for line in TEXT.strip().splitlines():
        name, common, description, identification, keys = line.split('|')
        assert name not in result
        assert all(k in SOURCES for k in keys.split(','))
        result[name] = dict(commonName=common, description=description, identification=identification, sourceKeys=keys.split(','))
    return result
