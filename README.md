# GeoHorizon Pro

GeoHorizon Pro é uma aplicação web avançada para projeções geográficas, cálculos de horizonte e medições precisas. A aplicação combina poderosas bibliotecas de geoprocessamento com uma interface moderna e intuitiva, permitindo ao usuário realizar cálculos geográficos complexos diretamente no navegador.

## Funcionalidades

### 1. Projeção Geográfica
- **Calcula projeções geográficas** com base em coordenadas de partida, azimute magnético e distância
- **Corrige automaticamente** a declinação magnética para fornecer azimutes verdadeiros
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
- **Sistema de anéis de distância** com legendas configuráveis
- **Bússola digital** que mostra a direção do norte
- **Marcadores personalizados** para pontos de interesse
- **Controle de zoom e escala** integrados

### 6. Recursos de Exportação
- **Exportação de dados em múltiplos formatos**:
  - GPX (formato padrão para dispositivos GPS)
  - KML (formato do Google Earth)
  - JSON (dados estruturados para uso programático)
- **Dados completos** incluindo coordenadas, modo de operação e timestamps

### 7. Interface Moderna
- **Design limpo e profissional** com paleta de cores temática
- **Modo claro e escuro** com suporte a preferências do sistema
- **Interface responsiva** que funciona em diferentes tamanhos de tela
- **Notificações visuais** para feedback de ações do usuário
- **Animações suaves** para melhor experiência do usuário

### 8. Localização
- **Geolocalização automática** usando recursos do navegador
- **Seleção manual de coordenadas** diretamente no mapa
- **Centralização rápida** em localização padrão (Abrolhos, BA)
- **Precisão de até 6 casas decimais** nas coordenadas

## Tecnologias Utilizadas

- **Leaflet.js** - Biblioteca de mapas interativos
- **Turf.js** - Biblioteca de análise geoespacial
- **CSS Moderno** - Design responsivo e temas dinâmicos
- **JavaScript Puro** - Lógica de aplicação sem frameworks pesados
- **API de Geolocalização do Navegador** - Recuperação de posição atual
- **API de Orientação de Dispositivo** - Funcionalidade da bússola

## Instalação

Para executar localmente:

1. Clone ou baixe o projeto
2. Abra o arquivo `index.html` em qualquer navegador moderno
3. Não é necessário servidor web para funcionamento básico
4. Para funcionalidades completas, recomenda-se servir via HTTPS (especialmente para geolocalização)

## Uso

1. Selecione o modo de operação desejado (Projeção, Horizonte, Objeto ou Medição)
2. Insira as coordenadas manualmente ou utilize a geolocalização
3. Configure os parâmetros específicos para cada modo
4. Execute o cálculo e visualize os resultados no mapa
5. Exporte os dados conforme necessário

## Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests para melhorar a funcionalidade, usabilidade ou documentação da aplicação.