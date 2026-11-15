# GeoHorizon Pro

GeoHorizon Pro é uma aplicação web avançada para projeções geográficas, cálculos de horizonte e medições precisas. A aplicação combina poderosas bibliotecas de geoprocessamento com uma interface moderna e intuitiva, permitindo ao usuário realizar cálculos geográficos complexos diretamente no navegador.

## Funcionalidades

### 1. Projeção Geográfica
- **Calcula projeções geográficas** com base em coordenadas de partida, azimute magnético e distância
- **Permite informar a declinação magnética** para converter o azimute magnético em verdadeiro
- **Usa Abrolhos, BA como valor inicial**; ajuste a declinação para a localização e data relevantes. Oeste é negativo e leste é positivo.
- **Visualiza graficamente** o ponto projetado no mapa com marcadores e linhas de trajetória
- **Exibe resultados detalhados** incluindo latitude, longitude, azimutes magnético e verdadeiro, e distância percorrida

### 2. Cálculo de Horizonte
- **Determina a distância até o horizonte** com base na altura do observador
- **Visualiza graficamente** a área de visibilidade no mapa
- **Fornece distâncias** em quilômetros e milhas náuticas
- **Considera a curvatura da Terra** para cálculos precisos

### 3. Cálculo de Objeto
- **Calcula a distância máxima** até onde um objeto pode ser avistado
- **Leva em consideração** tanto a altura do observador quanto a altura do objeto
- **Exibe a distância limite** de visibilidade entre dois pontos elevados
- **Aplica fórmulas geodésicas** para cálculos acurados

### 4. Medições no Mapa
- **Ferramenta de medição interativa** para medir distâncias entre dois pontos
- **Interface intuitiva** para marcação de pontos no mapa
- **Resultados instantâneos** em quilômetros e milhas náuticas
- **Visualização clara** da linha de medição no mapa

### 5. Recursos de Mapa
- **Três estilos de mapa**: OpenStreetMap, Satélite e Terreno
- **Sistema de anéis de distância** com quantidade, intervalo e unidade independentes configuráveis (m, km ou NM), além de legendas opcionais
- **Unidade configurável** para entrada, resultados, anéis e escala do mapa: metros, quilômetros ou milhas náuticas
- **Bússola digital** que mostra a direção do norte
- **Marcadores personalizados** para pontos de interesse
- **Controle de zoom e escala** integrados

### 6. Recursos de Exportação
- **Exportação de dados em múltiplos formatos**:
  - GPX (formato padrão para dispositivos GPS)
  - KML (formato do Google Earth)
  - JSON (dados estruturados para uso programático)
- **Parâmetros e último resultado do modo atual**, coordenadas, preferências e timestamps nos três formatos
- **Pontos e trajetos** em GPX/KML; os círculos de horizonte e objeto são exportados como contornos aproximados

### 7. Interface Moderna
- **Design limpo e profissional** com paleta de cores temática
- **Modo claro e escuro** com suporte a preferências do sistema
- **Interface responsiva** que funciona em diferentes tamanhos de tela
- **Notificações visuais** para feedback de ações do usuário
- **Animações suaves** para melhor experiência do usuário

### 8. Localização
- **Geolocalização automática** usando recursos do navegador
- **Posição inicial do mapa configurável** por latitude/longitude, com opção para salvar a localização atual
- **Seleção manual de coordenadas** diretamente no mapa ou entrada nos formatos graus decimais, graus/minutos decimais, graus/minutos/segundos e UTM
- **Siglas cardinais opcionais** (N/S/E/W); UTM usa zona e hemisfério
- **Centralização rápida** em localização padrão (Abrolhos, BA)
- **Precisão de até 6 casas decimais** nas coordenadas
- **Preferências salvas no navegador** para unidade geral, formato de coordenadas, siglas cardinais, posição inicial e configuração independente dos anéis

## Tecnologias Utilizadas

- **Leaflet.js** - Biblioteca de mapas interativos
- **Turf.js** - Biblioteca de análise geoespacial
- **Proj4js** - Conversão entre coordenadas geográficas e UTM
- **CSS Moderno** - Design responsivo e temas dinâmicos
- **JavaScript Puro** - Lógica de aplicação sem frameworks pesados
- **API de Geolocalização do Navegador** - Recuperação de posição atual
- **API de Orientação de Dispositivo** - Funcionalidade da bússola

## Instalação

Para executar localmente:

1. Clone ou baixe o projeto
2. Abra o arquivo `index.html` em qualquer navegador moderno. Ele é a única página de entrada oficial; as alterações da aplicação devem partir dessa versão e dos arquivos compartilhados em `src/`.
3. Não é necessário servidor web para funcionamento básico
4. Para funcionalidades completas, recomenda-se servir via HTTPS (especialmente para geolocalização)

## Uso

1. Selecione o modo de operação desejado (Projeção, Horizonte, Objeto ou Medição)
2. Abra **Configurações** para escolher unidades, formato de coordenadas e opções do mapa; as preferências são salvas no navegador
3. Insira as coordenadas no formato selecionado ou utilize a geolocalização
4. Configure os parâmetros específicos para cada modo; no modo Projeção, revise a declinação magnética para o local e a data da medição
5. Execute o cálculo e visualize os resultados no mapa
6. Exporte os dados conforme necessário

As exportações registram o último cálculo concluído no modo atual, mesmo que seus campos sejam editados depois. Ao trocar de modo ou remover o resultado, realize um novo cálculo para exportá-lo; sem resultado, é exportada apenas a localização do observador e as configurações. Uma medição concluída continua disponível ao mudar a localização do observador. Na projeção, a elevação deve ser informada e é registrada como parâmetro, mas não altera as coordenadas calculadas.

Os dados numéricos usam coordenadas WGS84 em graus decimais, distâncias em quilômetros, alturas em metros e ângulos em graus. GPX e KML incluem os mesmos dados do JSON, respectivamente, em extensões GPX e `ExtendedData`; outros aplicativos podem não apresentar esses metadados. O contorno de horizonte/objeto é uma aproximação geodésica de 64 segmentos, dividida ao cruzar o antimeridiano. Para raio zero, apenas o centro é exportado. Raios maiores ou iguais à metade da circunferência terrestre não têm contorno GPX/KML exportável; nesse caso, use JSON.

## Testes

Execute os testes de cálculos, preferências, conversão UTM e fluxos do mapa com:

```powershell
node --test tests\calculations.test.js tests\preferences.test.js tests\utm-workflow.test.js tests\map-lifecycle.test.js
```

## Melhorias planejadas

- [x] Permitir informar manualmente a declinação magnética e validar o intervalo de -180° a 180°.
- [x] Criar preferências para unidades de distância, formatos de coordenadas e siglas cardinais, incluindo conversão de/para UTM.
- [x] Reunir preferências de unidades, coordenadas e mapa em uma janela de configurações para manter a navegação principal mais compacta.
- [x] Validar formatos, limites de coordenadas e valores não negativos de distância e altura.
- [x] Remover linhas e geometrias antigas do mapa ao recalcular ou alterar a localização, preservando medições independentes.
- [x] Completar as exportações com os parâmetros e resultados do cálculo, alinhando os arquivos GPX, KML e JSON.
- [x] Definir `index.html` como única página de entrada oficial. `geohorizonPro.html` e `geohorizonPro_backup.html` são cópias legadas/de referência e não devem receber novas alterações; a implementação ativa fica em `index.html`, `src/css/` e `src/js/`.
- [x] Expandir os testes automatizados para fórmulas geográficas, validação e fluxo de conversão UTM, além dos cálculos, exportações e ciclo das camadas no mapa.

As alturas de observador/objeto permanecem em metros. A conversão UTM usa o datum WGS84 e só está disponível entre 80° S e 84° N.

Os cálculos de horizonte usam um modelo geométrico esférico simplificado; não consideram refração atmosférica, relevo nem obstáculos.

## Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests para melhorar a funcionalidade, usabilidade ou documentação da aplicação.
