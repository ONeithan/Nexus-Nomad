# Aplicativos da Central de Aplicativos (Supply Depot)

A Central de Aplicativos (Supply Depot) é onde você instala aplicativos adicionais no seu NOMAD, além das ferramentas nativas integradas. Cada aplicativo é executado em seu próprio contêiner no seu NOMAD, de forma 100% offline, exibindo um botão **Abrir** assim que a instalação for concluída.

Esta página reúne tudo o que você precisa saber para começar a usar cada aplicativo *especificamente no NOMAD*: se é necessário fazer login, quais são as credenciais padrão, onde seus arquivos são armazenados e o que você precisa ter em mãos antes de começar. Ela não substitui os manuais de uso de cada ferramenta em si — cada aplicativo é um projeto de código aberto independente, com documentação própria, para a qual fornecemos os links oficiais correspondentes.

Uma observação rápida sobre logins: alguns desses aplicativos possuem contas próprias, totalmente separadas do seu login do NOMAD. Quando um aplicativo solicitar autenticação, informamos aqui as credenciais iniciais e se você deve alterá-las.

---

## Gerenciando seus aplicativos

Cada aplicativo instalado recebe um menu **Gerenciar** em seu cartão. A partir dele, você pode:

- **Documentação** — acesse diretamente as instruções de introdução do NOMAD para esse aplicativo (as mesmas seções detalhadas abaixo).
- **Editar** — altere as configurações do aplicativo: mapeamento de portas, montagem de volumes, variáveis de ambiente e limites de memória/CPU. Isso funciona tanto para aplicativos do catálogo curado quanto para aplicativos personalizados. Suas edições são mescladas com a configuração existente do aplicativo, garantindo que ajustes avançados (como acesso à GPU no Assistente de IA) sejam preservados, e um aplicativo editado deixa de ser sobrescrito por atualizações do catálogo.
- **Logs** e **Estatísticas** — abra a visualização em tempo real do registro de logs do aplicativo ou seu consumo atual de memória e CPU, muito útil quando algo não estiver se comportando como esperado.
- **Atualizar** e **Remover** — baixe a versão mais recente de um aplicativo ou desinstale-o (com a opção de remover sua imagem Docker para liberar espaço). Caso o novo contêiner falhe ao iniciar após uma atualização, o NOMAD realiza automaticamente o rollback para a versão que estava funcionando.

**Visualizando a versão em execução:** Cada cartão de aplicativo exibe a versão instalada logo ao lado do nome (por exemplo, `Kiwix · 3.7.0`). Quando uma versão mais nova estiver disponível, um indicador laranja com **Atualização disponível** aparecerá no cartão para fácil identificação visual.

**Links de inicialização personalizados ("Abrir"):** Por padrão, o botão **Abrir** direciona para o endereço local do aplicativo no próprio NOMAD. Caso você use um proxy reverso ou DNS local e prefira abrir o aplicativo através de um domínio amigável (por exemplo, `https://jellyfin.minharede.local`), utilize a opção **Gerenciar › Definir URL personalizada** (ou **Editar**). O NOMAD mantém o link original guardado com segurança para que você possa alternar de volta quando desejar, e o endereço personalizado é preservado mesmo após atualizações.

**Mantendo aplicativos atualizados automaticamente:** Os aplicativos instalados podem ser atualizados de maneira autônoma. Essa função requer ativação em dois níveis — uma chave mestra em **Configurações → Atualizações** e uma opção individual por aplicativo na Central de Aplicativos — aplicando de forma automática apenas atualizações secundárias e correções (minor e patch); versões principais (major) sempre permanecem manuais. Consulte o [Guia de Atualizações](/docs/updates) para obter todas as informações.

---

## Adicionando seu próprio aplicativo Docker

Além do catálogo curado, a Central de Aplicativos pode executar **seu próprio contêiner Docker** como um aplicativo gerenciado junto aos demais. Clique em **Adicionar App Docker** e informe ao NOMAD:

- a **imagem** a ser baixada (por exemplo, `ghcr.io/owner/app:1.2.3`),
- os **mapeamentos de portas**, **montagens de volumes**, **variáveis de ambiente** e **limites de memória/CPU** necessários.

Conforme você preenche os campos, o NOMAD realiza uma verificação prévia em tempo real (pre-flight check) e avisa sobre eventuais conflitos de portas ou configurações de risco. Alguns avisos (como registros não verificados ou a tag `:latest`, que impede o rastreamento preciso de versão) são informativos e você pode optar por **Instalar mesmo assim**; configurações comprovadamente inseguras são bloqueadas de imediato.

Uma vez instalado, um aplicativo personalizado se comporta exatamente como qualquer outro: ele conta com o mesmo menu **Gerenciar** (Editar, Logs, Estatísticas, Atualizar, Remover), exibe sua versão no cartão e pode participar das atualizações automáticas. O NOMAD protege os pontos de montagem no host e isola os logs e estatísticas estritamente aos seus contêineres gerenciados, garantindo que o aplicativo personalizado não acesse nada além do que você conceder.

> Um aplicativo personalizado é exclusivamente seu. O NOMAD o executa e gerencia sua infraestrutura básica, mas não fornece documentação de configuração nem suporte para softwares fora do catálogo curado. Consulte a documentação oficial do projeto para saber como utilizá-lo.

---

## Stirling PDF {% #stirling-pdf %}

Uma caixa de ferramentas completa para trabalhar com PDFs, tudo rodando em seu próprio hardware. Mescle e divida arquivos, converta de e para PDF, comprima, gire, adicione ou remova senhas, execute OCR em documentos escaneados para torná-los pesquisáveis, assine, adicione marcas d'água e oculte informações sensíveis (redação). São mais de 50 utilitários disponíveis e, como tudo roda localmente, nenhum de seus documentos sai do seu NOMAD.

**Site oficial:** [stirlingpdf.com](https://stirlingpdf.com) · **Código-fonte:** [github.com/Stirling-Tools/Stirling-PDF](https://github.com/Stirling-Tools/Stirling-PDF)

**Primeira vez que você abre:** O aplicativo abre diretamente nas ferramentas, sem exigir nenhum login. Configuramos o Stirling para ignorar sua tela de login por padrão, pois no NOMAD ele é uma ferramenta de uso pessoal em sua rede local, onde uma barreira de senha costuma ser desnecessária. Você verá a indicação "Guest" no canto inferior esquerdo, o que é totalmente normal.

**Atenção, inicialização um pouco mais lenta:** O Stirling PDF é uma aplicação Java robusta. Após instalá-lo, aguarde de 30 a 60 segundos para que a inicialização seja concluída antes de carregar a interface. Ele também consome uma quantidade significativa de memória (aproximadamente 1 GB de RAM), funcionando de forma mais fluida em dispositivos NOMAD com boa folga de recursos.

**Deseja proteger com senha?** Se preferir que o Stirling exija login (por exemplo, se várias pessoas compartilham o mesmo NOMAD e você deseja restringir o acesso), é possível reativar a autenticação pelo NOMAD:

1. Na página da Central de Aplicativos, localize o Stirling PDF e clique em **Gerenciar > Editar**.
2. Em **Variáveis de Ambiente**, altere `SECURITY_ENABLELOGIN=false` para `SECURITY_ENABLELOGIN=true`.
3. Salve. O NOMAD recria o contêiner e a tela de login volta a ser exibida.

Na primeira vez que fizer login após essa alteração, utilize o usuário `admin` e a senha `stirling`. O Stirling exigirá que você defina uma nova senha imediatamente. Observe que essa é a única maneira de reativar a autenticação: o menu interno de configurações do Stirling fica bloqueado quando não há usuário logado, portanto a reativação deve ser feita pela tela de Edição do NOMAD, e não por dentro do próprio Stirling.

**Seus dados:** As configurações do aplicativo ficam salvas na pasta `storage/stirling-pdf` no seu NOMAD. Os arquivos PDF enviados para manipulação são processados na operação e baixados de volta para o seu dispositivo cliente. O Stirling não funciona como um repositório de documentos de longo prazo, de modo que ele não retém seus PDFs após o processamento.

**De onde vêm seus PDFs (e por que os arquivos do NOMAD não aparecem diretamente nele):** O Stirling manipula arquivos a partir do dispositivo que você estiver utilizando — seu notebook, celular ou tablet. Você clica em "Abrir do computador", seleciona o PDF, faz as edições desejadas e baixa o resultado de volta para o seu aparelho. O Stirling não tem acesso direto aos arquivos armazenados em outras áreas do NOMAD, não exibindo suas pastas de livros, documentos da Base de Conhecimento ou itens do Gerenciador de Arquivos. Se o PDF desejado já estiver no NOMAD, baixe-o primeiro para o seu dispositivo (usando o Gerenciador de Arquivos, por exemplo) e depois abra-o no Stirling. É uma etapa adicional simples, mas é ela que garante que seus dados fiquem estritamente onde você os guardou, sem invasão entre aplicações.

**Funcionamento offline:** Todas as ferramentas de manipulação de PDF rodam localmente no seu NOMAD, operando 100% offline. Apenas alguns recursos secundários dependem de internet e não farão nada quando desconectado: a opção de importação do "Google Drive" e os links no rodapé (Pesquisa, Discord, GitHub). Nenhum deles é necessário para trabalhar com PDFs. O único recurso principal que possui componente online opcional é o OCR (reconhecimento óptico de caracteres em documentos escaneados), que já vem com suporte ao idioma inglês pré-instalado — a adição de pacotes de outros idiomas é a única parte que requer conexão temporária.

## Gerenciador de Arquivos (File Browser) {% #file-browser %}

Um gerenciador de arquivos web completo para o seu NOMAD. Navegue por diretórios, faça upload e download de arquivos, crie pastas, renomeie, mova e exclua itens diretamente pelo navegador, sem necessidade de instalar nada no seu computador. É uma forma prática de transferir arquivos para dentro e fora do dispositivo ou organizar conteúdos sem precisar recorrer ao terminal de linha de comando.

**Site oficial:** [filebrowser.org](https://filebrowser.org) · **Código-fonte:** [github.com/filebrowser/filebrowser](https://github.com/filebrowser/filebrowser)

**Primeira vez que você abre:** Uma tela de login será exibida. Acesse com o usuário `admin` e a senha `nomad`. **Altere essa senha imediatamente.** Esse padrão é idêntico em todas as instalações do NOMAD, portanto qualquer pessoa na sua rede que o conheça poderia obter acesso até que você o modifique. Clique no ícone de engrenagem de configurações, abra as configurações do seu perfil e defina uma nova senha segura.

Ao contrário da maioria dos aplicativos aqui, o Gerenciador de Arquivos mantém o login ativo intencionalmente. Ele tem permissão para renomear e excluir arquivos reais no seu NOMAD, tornando a proteção por senha indispensável mesmo em rede local restrita.

**O que você pode visualizar:** O Gerenciador de Arquivos exibe as principais pastas de conteúdo do seu NOMAD em um único local:

- **books** - e-books e livros digitais, incluindo todo o material lido pelo Calibre-Web
- **maps** - dados e pacotes de mapas baixados
- **media** - vídeos, músicas e fotos, incluindo arquivos transmitidos pelo Jellyfin
- **zim** - acervos offline baixados, como a Wikipédia e outras bibliotecas de referência
- **kb_uploads** - documentos adicionados à Base de Conhecimento (Knowledge Base)

Você pode enviar, baixar, renomear, mover e excluir itens dentro dessas pastas, e qualquer arquivo adicionado na raiz também é preservado. As pastas internas de sistema utilizadas diretamente na execução dos serviços (como modelos de IA, índices de busca e o cofre de senhas) ficam intencionalmente isoladas e fora do alcance do Gerenciador de Arquivos, evitando navegações indevidas ou exclusões acidentais.

> **Atenção ao excluir arquivos:** o que for apagado aqui é excluído permanentemente, sem lixeira. A maioria dos conteúdos pode ser recuperada (é possível baixar novamente um mapa ou arquivo ZIM da Wikipédia), mas se você excluir um livro, vídeo ou documento pessoal adicionado por você, essa cópia será perdida em definitivo. Exclua sempre com a mesma cautela que teria em seu próprio computador.

**Funcionamento offline:** Totalmente offline. O Gerenciador de Arquivos é executado integralmente no seu NOMAD e não se conecta à internet para nenhuma operação, funcionando com o mesmo desempenho esteja o dispositivo conectado ou não.

## Calibre-Web {% #calibre-web %}

Um leitor e organizador de bibliotecas de e-books baseado na web para a sua coleção digital. Leia livros diretamente no navegador, organize seus títulos por autor, séries e tags, e envie arquivos para Kindles ou outros leitores eletrônicos. Ele se integra diretamente à pasta `books` do seu NOMAD, mantendo todo o seu acervo no dispositivo para acompanhar você onde quer que vá.

**Site oficial:** [github.com/janeczku/calibre-web](https://github.com/janeczku/calibre-web)

**Primeira vez que você abre:** O Calibre-Web precisa apontar para um banco de dados de biblioteca, e o NOMAD cria automaticamente uma biblioteca vazia durante a instalação para evitar erros de configuração. Este é o fluxo de configuração inicial (executado uma única vez):

1. Abra o Calibre-Web. Ele iniciará na tela de **Database Configuration** (Configuração do Banco de Dados).
2. No campo **Location of Calibre Database** (Localização do Banco de Dados Calibre), digite `/books` e clique em **Save** (Salvar). Você verá a mensagem "Database Settings updated" e sua biblioteca (ainda vazia) será aberta.
3. A configuração está concluída! Sua biblioteca está pronta para receber novos livros.

Se em algum momento for solicitado login, as credenciais padrão são `admin` / `admin123`. **Altere essa senha** assim que acessar o sistema (clique em `admin` no canto superior direito e selecione Editar). Esse é o acesso padrão de fábrica em qualquer NOMAD.

**Adicionando livros:** O upload direto pela interface web vem desativado por padrão. Para ativá-lo, acesse o menu **Admin** (canto superior direito), edite a configuração básica marcando a permissão de uploads e um botão de Enviar (Upload) passará a ser exibido. Você também pode simplesmente transferir arquivos de e-book diretamente para a pasta `books` usando o Gerenciador de Arquivos (File Browser) e, em seguida, usar a opção "Verificar/Scan" do Calibre-Web para indexá-los automaticamente.

**Seus dados:** Sua biblioteca fica armazenada na pasta `books` do seu NOMAD (a mesma pasta `books` visível no Gerenciador de Arquivos). Cada livro adicionado é salvo nesse local, portanto fazer backup dessa pasta garante a preservação de toda a sua coleção.

**Funcionamento offline:** A leitura e o gerenciamento da sua biblioteca funcionam 100% offline. O único recurso que utiliza internet é a busca de metadados ("fetch metadata"), que puxa capas e sinopses de fontes online. Essa função não operará quando estiver sem conexão, mas isso não afeta em nada a leitura ou a organização dos livros já armazenados.

## IT Tools {% #it-tools %}

Uma coleção prática com mais de 100 pequenos utilitários que você normalmente precisaria pesquisar na internet: geradores de hash, codificadores Base64 e URL, formatadores de JSON e SQL, geradores de UUID, criador de QR Code, conversores de cores e muito mais. Tudo roda localmente no seu NOMAD, disponível a qualquer momento sem depender de internet.

**Site oficial:** [it-tools.tech](https://it-tools.tech) · **Código-fonte:** [github.com/CorentinTh/it-tools](https://github.com/CorentinTh/it-tools)

**Primeira vez que você abre:** O aplicativo abre imediatamente na tela de ferramentas. Não há login, cadastro de conta nem etapas de configuração. Basta escolher a ferramenta na barra lateral e usá-la.

**Seus dados:** Não há nada para gerenciar. O IT Tools não salva dados no seu NOMAD entre as sessões; não há arquivos persistentes, bancos de dados ou credenciais para controlar. É o aplicativo mais direto e leve da Central de Aplicativos.

**Funcionamento offline:** Cada utilitário é executado diretamente no seu navegador a partir da cópia hospedada no seu NOMAD. Nenhuma função requer acesso à internet, mantendo total disponibilidade offline.

## Excalidraw {% #excalidraw %}

Um quadro branco virtual intuitivo para criar diagramas rápidos, croquis e esboços com estilo de desenho à mão. Crie formas geométricas, setas, desenhos livres, insira textos e imagens e elabore fluxogramas, diagramas de rede ou anotações visuais em segundos. A interface tem um visual amigável e descontraído, funcionando diretamente no navegador.

**Site oficial:** [excalidraw.com](https://excalidraw.com) · **Código-fonte:** [github.com/excalidraw/excalidraw](https://github.com/excalidraw/excalidraw)

**Primeira vez que você abre:** O aplicativo abre diretamente em uma tela de desenho em branco. Sem login, sem cadastro, sem passos de configuração. Escolha uma forma na barra superior e comece a desenhar. Uma breve mensagem de boas-vindas lembrará que seu trabalho fica salvo no navegador, o que nos leva ao ponto fundamental sobre o Excalidraw no NOMAD.

**Onde seus desenhos ficam salvos (leia com atenção):** Esta versão do Excalidraw não mantém armazenamento persistente no disco do NOMAD. Seus desenhos são salvos no armazenamento local do navegador web que você estiver utilizando naquele aparelho específico. Isso implica o seguinte:

- Seus desenhos **não são sincronizados automaticamente entre aparelhos**. O que você desenhar no seu notebook não aparecerá ao abrir o Excalidraw no celular, pois cada navegador armazena sua própria cópia local.
- Se você **limpar os dados de navegação/cookies do navegador** ou utilizar uma janela anônima, o desenho será perdido. Não há cópia no servidor NOMAD para recuperação.
- Portanto, **salve seus trabalhos em arquivo.** Utilize o menu principal (canto superior esquerdo) e escolha **Salvar em...** gerando um arquivo com extensão `.excalidraw`, guardando-o em um local seguro (por exemplo, nas suas pastas de documentos ou mídia através do Gerenciador de Arquivos). Para continuar editando depois, basta clicar em **Abrir** e carregar esse arquivo. Esse é o método seguro para preservar seus diagramas no longo prazo ou transferi-los para outros aparelhos.

**Seus dados:** Como tudo permanece salvo no seu próprio navegador, não há pastas de armazenamento nem credenciais do NOMAD associadas ao Excalidraw. Os arquivos que você exportar ficarão onde você decidir guardá-los.

**Funcionamento offline:** O quadro branco funciona de forma offline: você pode desenhar, editar e salvar arquivos normalmente sem internet. Três observações importantes:

- **A tipografia característica com estilo manuscrito depende originalmente de fontes online.** Quando o NOMAD estiver desconectado, o Excalidraw não consegue baixar essas fontes e recorre a uma fonte padrão do sistema operacional, fazendo com que os textos fiquem com um visual mais reto. Os desenhos em si não sofrem nenhuma alteração, apenas a exibição das letras.
- **O Excalidraw envia telemetria anônima básica quando o NOMAD está online.** Os desenvolvedores originais do projeto incluem uma contagem simples de visualizações de página (via Simple Analytics) para registrar que o app foi aberto. Esse rastreamento não acessa seus desenhos nem transmite informações quando o NOMAD está offline, mas fazemos questão de esclarecer sua existência para manter total transparência, já que o NOMAD preza pelo isolamento de dados.
- **Alguns botões correspondem a serviços em nuvem que não funcionam no NOMAD.** "Colaboração ao vivo", "Cadastrar-se" e "Excalidraw+" apontam para o serviço comercial online dos criadores da ferramenta e exigem conexão à internet. Eles não fazem parte do seu quadro branco local e podem ser ignorados. O mesmo se aplica ao explorador de **Biblioteca** de formas prontas, que depende de uma galeria online externa.

## Homebox {% #homebox %}

Um sistema de inventário doméstico e patrimonial completo para você organizar tudo o que possui. Cadastre seus pertences agrupando por locais e etiquetas, anexe fotos, registre números de série, valores pagos, prazos de garantia e comprovantes de compra, encontrando qualquer item rapidamente por meio da busca integrada. Uma ferramenta indispensável para registros de seguro, controle de garantias e organização de estoques e peças.

**Site oficial:** [homebox.software](https://homebox.software) · **Código-fonte:** [github.com/sysadminsmedia/homebox](https://github.com/sysadminsmedia/homebox)

**Primeira vez que você abre:** O Homebox exibe uma tela de autenticação, mas como ainda não há contas cadastradas, você deve criar a sua. Clique em **Registrar** (Register) e preencha:

- **seu e-mail** (usado como nome de usuário para login),
- **seu nome**,
- **uma senha** (o Homebox inclui um medidor de segurança e exige uma senha forte para permitir o cadastro).

Clique em **Registrar** e, em seguida, faça login com o e-mail e senha criados. A primeira conta cadastrada se torna automaticamente a **proprietária (owner)** desta instância do Homebox. Não existem senhas de fábrica para alterar; a conta já nasce configurada por você.

**Compartilhando seu NOMAD com outras pessoas?** Por padrão, o Homebox permite que qualquer usuário com acesso à rede crie uma conta própria. Se o dispositivo for de uso estritamente seu ou de sua confiança, não há problema. Caso prefira fechar novos cadastros após criar seu acesso inicial:

1. Crie primeiramente sua conta de proprietário (conforme explicado acima).
2. Na página da Central de Aplicativos, localize o Homebox e clique em **Gerenciar > Editar**.
3. Em **Variáveis de Ambiente**, adicione `HBOX_OPTIONS_ALLOW_REGISTRATION=false`.
4. Salve. O NOMAD reinicia o contêiner e o botão de Registro deixará de aceitar novos cadastros. Você continuará fazendo login normalmente.

**Seus dados:** Todas as informações do Homebox ficam salvas em uma única pasta no seu NOMAD, `storage/homebox`, estruturadas em um arquivo de banco de dados (acompanhado das fotos e notas anexadas). Fazer backup dessa pasta preserva integralmente todo o seu inventário.

**Funcionamento offline:** 100% offline. O Homebox roda exclusivamente no seu NOMAD, mantém todos os dados gravados localmente e não realiza nenhuma telemetria externa, operando com total autonomia esteja o servidor conectado ou não à internet. Os links exibidos no cabeçalho (GitHub, Discord e site do projeto) são apenas atalhos informativos externos e não interferem no uso do inventário.

## Vaultwarden {% #vaultwarden %}

Um gerenciador de senhas pessoal e seguro rodando diretamente no seu NOMAD. Totalmente compatível com o ecossistema Bitwarden, permite armazenar credenciais de acesso, notas seguras e dados de cartões em um cofre criptografado. Você pode utilizar as extensões oficiais para navegadores e aplicativos móveis do Bitwarden conectando-os ao seu NOMAD, mantendo seus dados sob seu controle e fora de servidores em nuvem de terceiros.

**Site oficial:** [bitwarden.com](https://bitwarden.com) (para aplicativos e extensões) · **Código-fonte:** [github.com/dani-garcia/vaultwarden](https://github.com/dani-garcia/vaultwarden)

**Primeira vez que você abre (aviso de certificado de segurança):** Gerenciadores de senhas exigem conexões estritamente criptografadas (HTTPS) para funcionar. Por isso, o NOMAD configura o Vaultwarden com HTTPS de forma automática. Como o NOMAD é um servidor privado na sua rede local e não um site público na internet, ele utiliza um certificado digital autoassinado, fazendo com que os navegadores mostrem um aviso de segurança no primeiro acesso. O alerta parece preocupante, mas é o comportamento esperado para dispositivos locais. Para prosseguir:

1. Clique em **Abrir** no cartão do Vaultwarden. Seu navegador exibirá uma mensagem como *"Sua conexão não é particular"* ou *"Não seguro"*.
2. Clique em **Avançado** e depois em **Ir para (endereço do seu NOMAD)** (em alguns navegadores o botão pode se chamar "Continuar" ou "Aceitar o risco e continuar").
3. O cofre do Vaultwarden será aberto. O navegador salvará essa exceção e você não verá mais esse aviso no mesmo dispositivo.

**Criando seu cofre:** Na página inicial de login, clique em **Criar conta**, insira seu **e-mail** e defina uma **senha mestra**.

> **Sua senha mestra não pode ser recuperada.** O Vaultwarden não possui serviço de redefinição por e-mail nem opção de recuperação, por projeto de segurança criptográfica — o sistema jamais tem conhecimento da sua senha. Se você esquecê-la, o cofre e todas as senhas armazenadas ficarão inacessíveis de forma irreversível. Escolha uma senha forte que você não vá esquecer e anote-a em um local físico seguro.

**Compartilhando seu NOMAD com outras pessoas?** Por padrão, qualquer pessoa que acessar a tela do Vaultwarden pode criar uma conta individual (cada conta possui seu cofre isolado e criptografado separadamente). Caso queira impedir novos cadastros após criar a sua conta:

1. Crie sua conta primeiro.
2. Na página da Central de Aplicativos, localize o Vaultwarden e clique em **Gerenciar > Editar**.
3. Em **Variáveis de Ambiente**, adicione `SIGNUPS_ALLOWED=false`.
4. Salve. O NOMAD recria o contêiner e novos cadastros são bloqueados, mantendo as contas existentes funcionando normalmente.

**Usando no celular e nas extensões do navegador:** Instale o aplicativo ou extensão oficial do Bitwarden. Na tela inicial de login, selecione a opção de servidor personalizado / auto-hospedado (**self-hosted** ou "URL do Servidor") e informe `https://(endereço_do_seu_NOMAD):8480`. Vale notar que alguns aplicativos para celular aplicam restrições mais severas a certificados autoassinados e podem recusar a conexão; o cofre web acessado pelo navegador no NOMAD sempre funciona perfeitamente.

**Seus dados:** Seu cofre criptografado fica armazenado na pasta `storage/vaultwarden` no seu NOMAD. Fazer backup dessa pasta protege todos os seus dados. (O painel administrativo integrado do Vaultwarden vem desativado por padrão, a menos que você configure um token de administrador, o que não costuma ser necessário para a grande maioria dos usuários).

**Funcionamento offline:** Totalmente offline e seguro. O Vaultwarden é executado integralmente no seu NOMAD, armazena seu cofre de senhas localmente e não envia dados para a internet. Os aplicativos e extensões do Bitwarden também salvam uma cópia em cache local, permitindo que você consulte suas senhas mesmo quando o NOMAD ou o seu celular estiverem desconectados.

## Jellyfin {% #jellyfin %}

Seu próprio servidor de streaming de mídia. Aponte o Jellyfin para uma pasta com filmes, séries, músicas e fotos no seu NOMAD e ele organizará todo o conteúdo com capas, sinopses e detalhes, transmitindo para navegadores web, celulares, tablets, smart TVs ou aplicativos dedicados do Jellyfin. Uma alternativa autônoma e privada aos serviços de streaming comercial para aproveitar os arquivos que você já possui.

**Site oficial:** [jellyfin.org](https://jellyfin.org) · **Código-fonte:** [github.com/jellyfin/jellyfin](https://github.com/jellyfin/jellyfin)

**Primeira vez que você abre (assistente de configuração inicial):** Ao abrir, você passará por algumas etapas rápidas:

1. **Idioma** - selecione o idioma de exibição da interface e clique em Próximo.
2. **Crie sua conta de administrador** - informe um nome de usuário e uma senha. Esta é a conta mestre que administra todo o servidor, portanto defina uma senha forte e guarde-a com cuidado. (Mais usuários, incluindo perfis restritos para crianças, podem ser criados posteriormente pelo Painel de Controle).
3. **Adicione suas mídias** - clique em **Adicionar Biblioteca de Mídia** e selecione o tipo de conteúdo. Para facilitar, o NOMAD já cria as pastas correspondentes dentro do seu diretório `media`. Basta associar cada biblioteca à sua pasta respectiva:
   - Biblioteca de **Filmes** → pasta `Movies`
   - Biblioteca de **Séries / Programas de TV** → pasta `TV Shows`
   - Biblioteca de **Músicas** → pasta `Music`
   - Biblioteca de **Fotos** → pasta `Photos`

   **Aponte cada biblioteca para sua pasta específica, e nunca para a pasta raiz `media`.** Este detalhe é fundamental: se você apontar uma biblioteca para a pasta `media` geral (que engloba todas as outras) e outra para `Music`, o Jellyfin identificará arquivos duplicados ("duplicate path") e sua biblioteca de músicas deixará de ser exibida silenciosamente. Usar uma subpasta dedicada para cada tipo de mídia mantém tudo limpo e funcionando perfeitamente. Você também pode pular esta etapa agora e adicionar as bibliotecas mais tarde pelo Painel de Controle.
4. **Metadados, acesso remoto e conclusão** - aceite as opções padrão nas telas seguintes e conclua o assistente. Depois, faça login com a conta criada.

**Enviando seus arquivos de mídia:** Coloque os arquivos na subpasta correspondente dentro da pasta **media** do seu NOMAD (a mesma pasta `media` visível no Gerenciador de Arquivos): filmes em **Movies**, séries em **TV Shows**, músicas em **Music** (organizar uma pasta para cada álbum funciona muito bem) e imagens em **Photos**. O fluxo mais prático é carregar os arquivos pelo Gerenciador de Arquivos (ou transferi-los como preferir) e depois clicar em **Escanear Biblioteca** no Jellyfin para indexá-los. O Jellyfin lê subdiretórios normalmente (uma pasta de álbum inteira dentro de `Music` é identificada como um único disco). Ele também se beneficia de arquivos nomeados de forma padronizada (como `Nome do Filme (2020).mp4`), o que facilita a localização automática das capas e informações corretas.

**Seus dados:** Seus arquivos de mídia ficam armazenados em `storage/media`. As configurações do Jellyfin, contas de usuários e capas baixadas ficam em `storage/jellyfin`. Seus arquivos originais nunca são modificados; o Jellyfin apenas realiza a leitura deles.

**Funcionamento offline:** A transmissão das suas próprias mídias é totalmente offline — este é o grande objetivo da ferramenta. A única funcionalidade que depende de internet é a **obtenção de metadados**: quando o Jellyfin adiciona um filme ou série, ele tenta buscar capas, sinopses e elenco em bancos de dados online. Sem conexão, itens novos aparecerão com seus nomes de arquivo normais e sem ilustrações, mas serão reproduzidos normalmente. Assim que a conexão for restabelecida, uma simples verificação de biblioteca baixará as capas faltantes.

> **Observação sobre desempenho de reprodução:** O Jellyfin reproduz a grande maioria dos formatos com facilidade. Porém, se o formato de um vídeo não for suportado diretamente pelo dispositivo em que você está assistindo, o Jellyfin precisará convertê-lo em tempo real ("transcodificação"), o que demanda bastante processamento. O NOMAD não ativa aceleração por placa de vídeo para transcodificação por padrão, o que pode causar travamentos em vídeos muito pesados ou em altíssima resolução caso o hardware do NOMAD seja modesto. Reproduzir arquivos em formatos amplamente compatíveis (como MP4 com codec H.264) dispensa a transcodificação e garante máxima fluidez.

## Meshtastic Web {% #meshtastic-web %}

Um painel de controle via navegador para dispositivos [Meshtastic](https://meshtastic.org). O Meshtastic é uma tecnologia de comunicação via rádio off-grid de longo alcance: rádios LoRa pequenos e econômicos formam uma rede mesh autônoma capaz de trocar mensagens de texto e coordenadas de GPS por quilômetros, sem sinal de celular, sem internet e sem custos de operadora. Este aplicativo permite configurar esses rádios e ler/enviar mensagens em uma tela de tamanho completo.

**Site oficial:** [meshtastic.org](https://meshtastic.org) · **Código-fonte:** [github.com/meshtastic/web](https://github.com/meshtastic/web)

**É necessário ter um rádio Meshtastic físico para usar este aplicativo.** O aplicativo atua apenas como interface de controle. Sem um dispositivo conectado, ele abrirá na tela "No devices connected", pois o processamento e a comunicação real ocorrem no hardware de rádio Meshtastic (e na rede de outros rádios com os quais ele se comunica). Se você ainda não possui um rádio, este aplicativo não terá utilidade no momento.

**Primeira vez que você abre:** O acesso é direto, sem tela de login. Clique em **New Connection** (Nova Conexão) e você verá três formas de conexão com o seu rádio:

- **HTTP** - conecta a um rádio que já esteja conectado à sua rede Wi-Fi, inserindo seu endereço IP. **Este é o método correto a ser utilizado no NOMAD** (veja a explicação abaixo).
- **Bluetooth** - pareamento com um rádio próximo via Bluetooth.
- **Serial** - conexão com um rádio plugado na porta USB.

**Particularidade importante no NOMAD (Bluetooth e Serial exigem HTTPS):** Os navegadores modernos só autorizam que páginas web acessem portas USB ou Bluetooth quando carregadas sob conexão criptografada (HTTPS). Como o NOMAD disponibiliza o Meshtastic Web via HTTP simples, **as opções de Bluetooth e Serial não funcionarão no NOMAD**, sendo bloqueadas pelo navegador. O método funcional é **HTTP**: conecte seu rádio Meshtastic à mesma rede Wi-Fi local (a maioria dos módulos Meshtastic possui Wi-Fi integrado) e faça a conexão informando o IP atribuído a ele. Caso precise obrigatoriamente fazer o pareamento via USB ou Bluetooth, utilize o aplicativo oficial do Meshtastic para smartphone ou acesse diretamente o site do Meshtastic.

**Seus dados:** Não há nada para salvar ou configurar no armazenamento do NOMAD para este aplicativo. As configurações do rádio ficam gravadas no próprio hardware do rádio e as preferências da interface ficam salvas no seu navegador. Não há diretório de dados no NOMAD a ser gerenciado.

**Funcionamento offline:** Totalmente offline, alinhado à proposta do ecossistema Meshtastic. A aplicação é servida pelo seu NOMAD e a comunicação com os rádios ocorre exclusivamente pela rede local ou pelas ondas de rádio, sem jamais passar pela internet. Os únicos elementos online são links informativos no rodapé (Vercel, termos legais), que não exercem nenhum impacto no funcionamento da sua rede de rádio.

## Plataforma Educacional (Kolibri) {% #kolibri %}

Uma plataforma completa de aprendizado offline desenvolvida pela Learning Equality. O Kolibri reúne videoaulas, exercícios interativos e leituras em canais estruturados, organiza turmas e lições, acompanha o progresso dos alunos e opera de forma autônoma no seu NOMAD, sem qualquer necessidade de internet. Foi projetado especificamente para escolas, centros comunitários e estudantes em áreas com conectividade limitada ou inexistente.

**Site oficial:** [learningequality.org/kolibri](https://learningequality.org/kolibri) · **Código-fonte:** [github.com/learningequality/kolibri](https://github.com/learningequality/kolibri)

**Primeira vez que você abre (assistente de configuração rápida):** Escolha o tipo de instalação/instituição e crie a **conta de administrador** (este é o usuário mestre responsável pela gestão de todo o sistema e turmas; defina uma senha forte e anote-a). Uma vez logado, você pode importar os conteúdos educativos na forma de **canais**.

**Importando conteúdo:** O material educativo do Kolibri é organizado em canais temáticos. Acesse **Dispositivo → Canais → Importar** (Device → Channels → Import) e escolha baixar canais online a partir do Kolibri Studio ou importar de um drive local / outro dispositivo Kolibri caso já possua os arquivos. A quantidade de acervo disponível é extensa, portanto selecione apenas os canais necessários, pois eles podem ocupar bastante espaço em disco.

**Migrando conteúdo da Plataforma Educacional antiga (Gen 1):** Versões anteriores do NOMAD utilizavam uma versão legada do Kolibri (imagem `treehouses/kolibri:0.12.8`). A Plataforma Educacional "Gen 2" traz a versão oficial mais recente do Kolibri e faz uma instalação **limpa** — os canais antigos e dados de estudantes **não** são transferidos automaticamente, pois as duas versões possuem formatos de banco de dados incompatíveis para migração direta. Se você usava a versão antiga e deseja importar os canais existentes para a nova, siga este procedimento:

1. Instale a "Plataforma Educacional (Gen 2)" pelo catálogo (ela roda em paralelo à versão antiga em uma porta diferente, sem interromper nada enquanto você a configura).
2. Abra a nova versão, passe pelo assistente de configuração inicial e, no menu lateral, navegue até **Dispositivo > Canais > Importar**. Selecione a opção "Rede local ou internet" e clique em "Adicionar novo dispositivo". Na janela exibida, digite o endereço IP do seu NOMAD junto com a porta da Plataforma Educacional antiga (porta 8300 por padrão, por exemplo `http://192.168.1.36:8300`), dê um nome de identificação à conexão e clique em "Adicionar" e depois em "Continuar".
3. Agora você poderá selecionar canais individuais da versão antiga ou escolher "Selecionar canais inteiros" para importar tudo de uma só vez. Clique em "Importar" e a transferência local será iniciada.
4. Quando tudo estiver conferido na nova instalação e os conteúdos estiverem transferidos, desinstale a Plataforma Educacional antiga pelo cartão dela (ela exibe a etiqueta **legado/legacy**). Recomenda-se também marcar a opção de remover a imagem antiga e o volume de dados ao desinstalar para liberar espaço em disco, mas se preferir mantê-la instalada temporariamente por garantia, não há problema.

**Seus dados:** Seus canais importados, turmas cadastradas e o progresso dos alunos ficam salvos na pasta `storage/kolibri-gen2` no seu NOMAD. Fazer o backup dessa pasta protege todo o ambiente do Kolibri.

**Funcionamento offline:** 100% offline após a importação dos canais, cumprindo rigorosamente a missão do Kolibri. A única etapa que requer internet é o download inicial de canais via Kolibri Studio; todo o restante — navegação nas aulas, resolução de exercícios e acompanhamento pedagógico — roda localmente no seu NOMAD.

## MeshCore Web {% #meshcore-web %}

Um cliente baseado em navegador para dispositivos de rádio [MeshCore](https://meshcore.io). O MeshCore é uma abordagem alternativa para redes de comunicação mesh via LoRa de longo alcance off-grid, similar ao Meshtastic: rádios compactos que formam uma malha própria e transmitem mensagens de texto e localização por quilômetros sem sinal de celular, sem internet e sem mensalidades. Este aplicativo permite configurar um rádio MeshCore e trocar mensagens através de uma tela ampla. Se você ainda não utiliza equipamentos específicos MeshCore, o cliente Meshtastic citado acima é a opção mais usual; esta ferramenta está disponível para quem utiliza o ecossistema MeshCore.

**Site oficial:** [meshcore.io](https://meshcore.io) · **Código-fonte:** [github.com/aXistem-dev/meshcore-web](https://github.com/aXistem-dev/meshcore-web) (versão empacotada do cliente MeshCore de Liam Cottle)

**É necessário ter um rádio MeshCore para utilizar este aplicativo.** Assim como no cliente Meshtastic, esta aplicação é apenas o painel de interface. Sem um rádio conectado, não há com quem o sistema se comunicar.

**Primeira vez que você abre (aviso de segurança esperado):** O MeshCore se comunica com seu rádio via USB ou Bluetooth, e os navegadores web só liberam essas conexões em páginas carregadas sob protocolo seguro (HTTPS). Por isso, o NOMAD serve esta aplicação com HTTPS automaticamente. Como o NOMAD é um servidor privado local sem domínio público, ele utiliza um certificado autoassinado que faz os navegadores apresentarem um alerta de segurança na primeira visita. Para prosseguir:

1. Clique em **Abrir** no cartão do MeshCore Web. Seu navegador exibirá algo como *"Sua conexão não é particular"* ou *"Não seguro"*.
2. Clique em **Avançado** e selecione **Ir para (endereço do seu NOMAD)** (em alguns navegadores o botão diz "Continuar" ou "Aceitar o risco e continuar").
3. Você entrará no MeshCore Web. O navegador memorizará a exceção para que você não veja mais o aviso nesse dispositivo.

**Conectando seu rádio:** Recomendamos utilizar o **Google Chrome ou Microsoft Edge**, que oferecem o melhor suporte aos padrões WebUSB e WebBluetooth. Conecte o rádio na porta USB do computador de onde você está acessando o navegador ou mantenha-o por perto (Bluetooth) e inicie a conexão pela interface do aplicativo. O rádio deve ser conectado **ao computador ou celular que você está manuseando**, e não ao servidor NOMAD em si. Alguns smartphones impõem restrições a certificados autoassinados e podem recusar a conexão; computadores desktop com Chrome ou Edge proporcionam a experiência mais estável.

**Seus dados:** Não há armazenamento de dados ou pastas no NOMAD para este aplicativo. As configurações do rádio ficam gravadas no próprio aparelho e as preferências da aplicação ficam salvas no navegador cliente. Não há arquivos no servidor a serem gerenciados.

**Funcionamento offline:** Totalmente offline. O aplicativo é servido pelo seu NOMAD e a comunicação com o rádio ocorre diretamente pelas conexões USB ou Bluetooth locais, sem trafegar dados pela internet.

## Biblioteca Traduzida {% #offline-translation %}

Permite ler a Biblioteca de Informações em outros idiomas. Ao abrir um artigo, uma barra com a opção **Traduzir esta página** surge no topo com um botão para cada idioma instalado, além de **Original** para retornar ao texto-fonte. O idioma escolhido permanece ativo enquanto você navega pelos artigos.

**Por que utilizar este módulo em vez do Assistente de IA:** Embora o Assistente de IA consiga traduzir textos, esta ferramenta especializada é cerca de 1.600 vezes mais rápida no mesmo hardware e dispensa placa de vídeo dedicada, funcionando com máxima agilidade em qualquer dispositivo NOMAD. Além disso, ela tem maior precisão com termos técnicos e nomes próprios: enquanto o Assistente de IA tende a traduzir literalmente nomes como "Project NOMAD", esta ferramenta os preserva adequadamente.

**Configurando os idiomas:** Por padrão, os idiomas francês, espanhol e alemão já vêm configurados. Para adicionar ou remover idiomas:

1. Na **Central de Aplicativos**, abra o menu **Gerenciar** da Biblioteca Traduzida e selecione **Editar**.
2. Em **Variáveis de Ambiente**, localize a linha `TRANSLATE_LANGS=fr,es,de`.
3. Altere a lista com os códigos de idioma desejados, separados por vírgula. Por exemplo, `TRANSLATE_LANGS=fr,es,de,pt` inclui o português.
4. Clique em **Salvar**. O aplicativo será reiniciado, fará o download dos modelos dos novos idiomas e adicionará um botão correspondente a cada um deles na barra de tradução.

O download de novos pacotes de idioma necessita de conexão temporária à internet. Cada idioma ocupa entre 45 MB e 140 MB de espaço em disco. Os idiomas já baixados continuam funcionando 100% offline. Remover um código da lista de variáveis não apaga o modelo baixado anteriormente do disco: ele permanece armazenado em `storage/translate/models` e mantém seu botão na barra.

Estes 50 idiomas estão disponíveis no momento (o idioma chinês ainda não está disponível):

| Idioma | Código |
|---|---|
| Africâner | `af` |
| Árabe | `ar` |
| Basco | `eu` |
| Bengali | `bn` |
| Bósnio | `bs` |
| Búlgaro | `bg` |
| Catalão | `ca` |
| Croata | `hr` |
| Tcheco | `cs` |
| Dinamarquês | `da` |
| Holandês (Neerlandês) | `nl` |
| Estoniano | `et` |
| Finlandês | `fi` |
| Francês | `fr` |
| Galego | `gl` |
| Alemão | `de` |
| Grego | `el` |
| Guzerate | `gu` |
| Hebraico | `he` |
| Hindi | `hi` |
| Húngaro | `hu` |
| Islandês | `is` |
| Indonésio | `id` |
| Italiano | `it` |
| Japonês | `ja` |
| Canarês (Kannada) | `kn` |
| Coreano | `ko` |
| Letão | `lv` |
| Lituano | `lt` |
| Malaio | `ms` |
| Malaiala (Malayalam) | `ml` |
| Marata (Marathi) | `mr` |
| Norueguês | `nb` |
| Persa | `fa` |
| Polonês | `pl` |
| Português | `pt` |
| Romeno | `ro` |
| Russo | `ru` |
| Sérvio | `sr` |
| Eslovaco | `sk` |
| Esloveno | `sl` |
| Espanhol | `es` |
| Sueco | `sv` |
| Tâmil | `ta` |
| Telugu | `te` |
| Tailandês | `th` |
| Turco | `tr` |
| Ucraniano | `uk` |
| Urdu | `ur` |
| Vietnamita | `vi` |

**Primeira inicialização requer internet:** Os modelos de linguagem são baixados na primeira execução do aplicativo, assim como ocorre na instalação de qualquer ferramenta. Depois disso, o funcionamento é totalmente offline. Se você instalar este aplicativo sem conexão à internet, ele ainda iniciará e a biblioteca funcionará normalmente, ficando apenas a tradução aguardando a conexão para buscar os modelos.

**O que não é traduzido:** Tabelas e caixas de informação (infoboxes), o título da página na aba do seu navegador e os resultados de pesquisa nativos do Kiwix. A barra de busca continua correspondendo ao idioma original do conteúdo — pesquise os artigos no idioma original e ative a tradução quando a página abrir.

**Diferença entre os botões de idioma:** A barra de ferramentas da biblioteca possui um ícone de globo que altera o idioma dos *menus e interface*. A barra adicionada por este aplicativo altera o conteúdo do *artigo em si*. São funções distintas que ficam próximas na tela devido à disposição dos elementos na interface.

**Precisão da tradução:** Trata-se de tradução automática neural de tradução literal direta. É excelente para compreender o sentido e o conteúdo geral de um artigo. Tenha cuidado ao depender dela para instruções médicas ou de segurança crítica onde termos técnicos exatos exijam precisão absoluta.

**Seus dados:** Os modelos de linguagem ficam gravados em `storage/translate/models`. Nenhum texto lido é armazenado ou transmitido externamente.

**Funcionamento offline:** Sim, 100% offline após a conclusão do download dos modelos de idioma.
