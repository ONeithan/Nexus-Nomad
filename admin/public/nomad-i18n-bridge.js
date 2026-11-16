;(function () {
  if (window.__NOMAD_I18N_ACTIVE__) return
  window.__NOMAD_I18N_ACTIVE__ = true

  const IS_IT_TOOLS = window.location.pathname.includes('/apps-pt/it-tools')
  const IS_CYBERCHEF = window.location.pathname.includes('/apps-pt/cyberchef')

  // Mantém a navegação SPA (Vue Router do IT-Tools) dentro de /apps-pt/it-tools/
  if (IS_IT_TOOLS) {
    const PREFIX = '/apps-pt/it-tools'
    const origPush = history.pushState.bind(history)
    const origReplace = history.replaceState.bind(history)
    const normalizeUrl = (u) => {
      if (typeof u === 'string' && u.startsWith('/') && !u.startsWith(PREFIX)) {
        return PREFIX + u
      }
      return u
    }
    history.pushState = function (state, title, url) {
      return origPush(state, title, normalizeUrl(url))
    }
    history.replaceState = function (state, title, url) {
      return origReplace(state, title, normalizeUrl(url))
    }
  }

  // Dicionário exato (case-insensitive via mapa normalizado)
  const EXACT_DICT = {
    // === IT-TOOLS: Menus, Categorias & Interface ===
    'IT-TOOLS': 'IT-TOOLS // N.O.M.A.D. PT-BR',
    'IT Tools': 'IT Tools (PT-BR)',
    'Handy tools for developers': 'Ferramentas práticas offline',
    'Search': 'Buscar ferramenta...',
    'Search tools...': 'Buscar ferramentas...',
    'Type to search...': 'Digite para buscar...',
    'All tools': 'Todas as ferramentas',
    'Favorite tools': 'Ferramentas favoritas',
    'Your favorite tools': 'Suas ferramentas favoritas',
    'No favorite tools yet': 'Nenhuma ferramenta favoritada ainda',
    'Crypto': 'Criptografia',
    'Converter': 'Conversores',
    'Web': 'Web & Rede',
    'Images and videos': 'Imagens e Vídeos',
    'Development': 'Desenvolvimento',
    'Network': 'Rede & IP',
    'Math': 'Matemática',
    'Measurement': 'Medidas',
    'Text': 'Texto',
    'Data': 'Dados',
    'Copy': 'Copiar',
    'Copied!': 'Copiado!',
    'Clear': 'Limpar',
    'Reset': 'Resetar',
    'Refresh': 'Atualizar',
    'Download': 'Baixar',
    'Generate': 'Gerar',
    'Encrypt': 'Criptografar',
    'Decrypt': 'Descriptografar',
    'Encode': 'Codificar',
    'Decode': 'Decodificar',
    'Input': 'Entrada',
    'Output': 'Saída',
    'Result': 'Resultado',
    'Settings': 'Configurações',
    'About': 'Sobre',

    // === FLATNOTES: Menus e Edição de Notas ===
    'New note': 'Nova nota',
    'Search notes...': 'Buscar notas...',
    'Search notes': 'Buscar notas',
    'All notes': 'Todas as notas',
    'Archive': 'Arquivar',
    'Archived': 'Arquivadas',
    'Trash': 'Lixeira',
    'Delete': 'Excluir',
    'Save': 'Salvar',
    'Preview': 'Pré-visualizar',
    'Edit': 'Editar',
    'Tags': 'Etiquetas / Tags',
    'Untitled': 'Sem título',
    'No notes found': 'Nenhuma nota encontrada',
    'Logout': 'Sair',
    'Dark mode': 'Modo escuro',
    'Light mode': 'Modo claro',
    'Created': 'Criado em',
    'Modified': 'Modificado em',

    // === IT-TOOLS: Títulos e Descrições das Ferramentas ===
    'Token generator': 'Gerador de Tokens',
    'Generate random string with the chars you want, uppercase or lowercase letters, numbers and/or symbols.':
      'Gere sequências aleatórias com letras maiúsculas, minúsculas, números e símbolos.',
    'Hash text': 'Gerar Hash de Texto',
    'Hash a text string using the function you need : MD5, SHA1, SHA256, SHA224, SHA512, SHA384, SHA3 or RIPEMD160':
      'Calcule hashes de texto usando MD5, SHA1, SHA256, SHA512, SHA3 ou RIPEMD160.',
    'Bcrypt': 'Gerador / Verificador Bcrypt',
    'Hash and compare text string using bcrypt. Bcrypt is a password-hashing function based on the Blowfish cipher.':
      'Crie e valide hashes de senha usando o algoritmo seguro Bcrypt.',
    'UUIDs generator': 'Gerador de UUIDs',
    'A Universally Unique Identifier (UUID) is a 128-bit number used to identify information in computer systems.':
      'Gere identificadores únicos universais (UUID v1, v4, v5) de 128 bits.',
    'ULID generator': 'Gerador de ULID',
    'Generate random Universally Unique Lexicographically Sortable Identifier (ULID).':
      'Gere identificadores ULID ordenáveis lexicograficamente.',
    'Encrypt / decrypt text': 'Criptografar / Descriptografar texto',
    'Encrypt clear text and decrypt ciphertext using crypto algorithms like AES, TripleDES, Rabbit or RC4.':
      'Criptografe e descriptografe textos usando AES, TripleDES, Rabbit ou RC4.',
    'Encrypt clear text and decrypt  ciphertext using crypto algorithms like AES, TripleDES, Rabbit or RC4.':
      'Criptografe e descriptografe textos usando AES, TripleDES, Rabbit ou RC4.',
    'Your text:': 'Seu texto:',
    'Your secret key:': 'Sua chave secreta:',
    'Encryption algorithm:': 'Algoritmo de criptografia:',
    'Your text encrypted:': 'Seu texto criptografado:',
    'Your encrypted text:': 'Seu texto criptografado:',
    'Your decrypted text:': 'Seu texto descriptografado:',
    'BIP39 passphrase generator': 'Gerador de Frase-Senha BIP39',
    'To Hexdump': 'Para Hexdump',
    'From Hexdump': 'De Hexdump',
    'Attempts to convert a hexdump back into raw data. This operation supports many different hexdump variations, but probably not all. Make sure you verify that the data it gives you is correct before continuing analysis.':
      'Tenta converter um hexdump de volta para dados brutos. Suporta várias variações de hexdump, mas verifique sempre se o resultado está correto antes de continuar a análise.',
    'HMAC generator': 'Gerador de HMAC',
    'Computes a hash-based message authentication code (HMAC) using a secret key and your favorite hashing function.':
      'Calcule códigos de autenticação HMAC usando chave secreta e função hash.',
    'RSA key pair generator': 'Gerador de Chaves RSA',
    'Generate a new random RSA private and public pem certificate key pair.':
      'Gere um novo par de chaves pública e privada RSA no formato PEM.',
    'Password strength analyser': 'Analisador de Força de Senha',
    'Discover the strength of your password with this client-side-only password strength analyser and crack time estimation tool.':
      'Avalie a segurança da sua senha e o tempo estimado de quebra localmente.',
    'PDF signature checker': 'Verificador de Assinatura PDF',
    'Verify the signatures of a PDF file.': 'Verifique assinaturas digitais de arquivos PDF.',
    'Date-time converter': 'Conversor de Data e Hora',
    'Convert date and time into the various different formats':
      'Converta datas e horários entre Timestamp Unix, ISO 8601, UTC e outros formatos.',
    'Integer base converter': 'Conversor de Base Numérica',
    'Convert a number between different bases (decimal, hexadecimal, binary, octal, base64, ...)':
      'Converta números entre decimal, hexadecimal, binário, octal e Base64.',
    'Roman numeral converter': 'Conversor de Números Romanos',
    'Convert Roman numerals to numbers and convert numbers to Roman numerals.':
      'Converta números arábicos para algarismos romanos e vice-versa.',
    'Base64 string encoder/decoder': 'Codificador / Decodificador Base64',
    'Simply encode and decode strings into their base64 representation.':
      'Codifique e decodifique textos rapidamente para o formato Base64.',
    'Base64 file converter': 'Conversor de Arquivo para Base64',
    'Convert a string, file, or image into its base64 representation.':
      'Converta arquivos ou imagens para representação Base64.',
    'Color converter': 'Conversor de Cores',
    'Convert color between the different formats (hex, rgb, hsl and css name)':
      'Converta cores entre HEX, RGB, HSL, HWB e nomes CSS.',
    'Case converter': 'Conversor de Maiúsculas / Minúsculas',
    'Transform the case of a string and choose between different formats':
      'Transforme textos para camelCase, snake_case, UPPERCASE, lowercase, etc.',
    'Text to NATO alphabet': 'Texto para Alfabeto Fonético NATO',
    'Transform text into the NATO phonetic alphabet for oral transmission.':
      'Converta textos para o alfabeto fonético militar NATO (Alfa, Bravo, Charlie...).',
    'Text to ASCII binary': 'Texto para Binário ASCII',
    'Convert text to its ASCII binary representation and vice versa.':
      'Converta texto em código binário ASCII e vice-versa.',
    'Text to Unicode': 'Texto para Unicode',
    'Parse and convert text to unicode and vice-versa':
      'Converta texto para códigos Unicode e vice-versa.',
    'YAML to JSON converter': 'Conversor YAML para JSON',
    'Simply convert YAML to JSON with this online live converter.':
      'Converta arquivos e blocos YAML para JSON instantaneamente.',
    'JSON to YAML converter': 'Conversor JSON para YAML',
    'Simply convert JSON to YAML with this online live converter.':
      'Converta JSON para YAML instantaneamente.',
    'JSON prettify and format': 'Formatar e Validar JSON',
    'Prettify your JSON string into a friendly, human-readable format.':
      'Indente, formate e valide estruturas JSON.',
    'JSON minify': 'Minificar JSON',
    'Minify and compress your JSON by removing unnecessary whitespace.':
      'Comprima JSON removendo espaços e quebras de linha.',
    'XML formatter': 'Formatador de XML',
    'Prettify your XML string into a friendly, human-readable format.':
      'Formate e indente documentos XML.',
    'SQL prettify and format': 'Formatador de SQL',
    'Format and prettify your SQL queries online (it supports various SQL dialects).':
      'Formate e organize consultas SQL em diversos dialetos.',
    'Encode/decode URL-formatted strings': 'Codificar / Decodificar URL',
    'Encode text to URL-encoded format (also known as "percent-encoded"), or decode it from it.':
      'Codifique e decodifique parâmetros e links no formato URL.',
    'URL parser': 'Analisador de URL',
    'Parse a URL into its separate constituent parts (protocol, origin, params, port, username-password, ...)':
      'Separe uma URL em protocolo, domínio, porta, caminho e parâmetros.',
    'JWT parser': 'Analisador de JWT',
    'Parse and decode your JSON Web Token (jwt) and display its content.':
      'Decodifique tokens JWT (Header e Payload) localmente.',
    'QR Code generator': 'Gerador de QR Code',
    'Generate and download a QR code for a URL or just text, and customize the background and foreground colors.':
      'Gere e baixe QR Codes offline para links, textos ou Wi-Fi.',
    'WiFi QR Code generator': 'Gerador de QR Code Wi-Fi',
    'Generate and download QR codes for quick connections to WiFi networks.':
      'Gere QR Codes para conectar dispositivos rapidamente a uma rede Wi-Fi.',
    'Regex Tester': 'Testador de Expressões Regulares (Regex)',
    'Test your regular expressions with sample text.':
      'Teste e valide expressões regulares (Regex) em tempo real.',
    'Crontab generator': 'Gerador de Expressões Crontab',
    'Validate and generate crontab and get the human-readable description of the cron schedule.':
      'Gere e traduza agendamentos Cron para linguagem legível.',
    'IPv4 subnet calculator': 'Calculadora de Sub-rede IPv4',
    'Parse your IPv4 CIDR blocks and get all the info you need about your subnet.':
      'Calcule máscara, broadcast, faixa de hosts e CIDR de redes IPv4.',
    'IPv4 address converter': 'Conversor de Endereço IPv4',
    'Convert an IP address into decimal, binary, hexadecimal, or even an IPv6 representation of it.':
      'Converta IPs IPv4 entre decimal, binário, hexadecimal e IPv6.',
    'MAC address lookup': 'Consulta de Endereço MAC',
    'Find the vendor and manufacturer of a device by its MAC address.':
      'Identifique o fabricante de um dispositivo pelo prefixo MAC.',
    'MAC address generator': 'Gerador de Endereço MAC',
    'Enter the quantity and prefix. MAC addresses will be generated in your chosen case (uppercase or lowercase)':
      'Gere endereços MAC aleatórios ou com prefixo customizado.',
    'Text statistics': 'Estatísticas de Texto',
    'Get information about a text, the number of characters, the number of words, its size in bytes, ...':
      'Conte caracteres, palavras, linhas e tamanho em bytes de um texto.',
    'Text diff': 'Comparador de Textos (Diff)',
    'Compare two texts and see the differences between them.':
      'Compare dois textos lado a lado e destaque todas as diferenças.',
    'Lorem ipsum generator': 'Gerador de Lorem Ipsum',
    'Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content':
      'Gere textos de preenchimento Lorem Ipsum para protótipos e layouts.',
    'Chmod calculator': 'Calculadora de Permissões Chmod',
    'Compute your chmod permissions and commands with this comprehensive chmod calculator.':
      'Calcule permissões Linux (755, 644, rwx) de forma visual.',
    'Docker run to Docker compose converter': 'Conversor Docker Run → Docker Compose',
    'Transforms "docker run" commands into docker-compose files!':
      'Converta comandos "docker run" em arquivos docker-compose.yml.',
    'HTTP status codes': 'Códigos de Status HTTP',
    'The list of all HTTP status codes, their name, and their meaning.':
      'Lista completa de códigos HTTP (200, 404, 500, etc.) e significados.',
    'MIME types': 'Tipos MIME',
    'Convert MIME types to file extensions and vice-versa.':
      'Consulte tipos MIME e suas extensões de arquivo correspondentes.',
    'Temperature converter': 'Conversor de Temperatura',
    'Degrees temperature conversions for Kelvin, Celsius, Fahrenheit, Rankine, Delisle, Newton, Réaumur and Rømer.':
      'Converta temperaturas entre Celsius, Fahrenheit, Kelvin e outras escalas.',
    'Benchmark builder': 'Calculadora de Média / Benchmark',
    'Easily compare execution times of tasks with this very simple benchmark builder.':
      'Compare tempos médios e desvios de execução entre tarefas.',
    'ETA calculator': 'Calculadora de Tempo Estimado (ETA)',
    'An ETA (Estimated Time of Arrival) calculator to determine the approximate end time of a task, for example, the time and duration of a file download.':
      'Calcule quanto tempo falta para concluir um download ou tarefa.',
    'Percentage calculator': 'Calculadora de Porcentagem',
    'Easily calculate percentages from a value to another value, or from a percentage to a value.':
      'Calcule porcentagens, aumentos e descontos rapidamente.',

    // === CYBERCHEF: Interface, Categorias e Operações ===
    'Operations': 'Operações',
    'Recipe': 'Receita (Fluxo)',
    'Input': 'Entrada',
    'Output': 'Saída',
    'BAKE!': 'PROCESSAR!',
    'Bake': 'Processar',
    'Auto Bake': 'Auto Processar',
    'Favourites': 'Favoritos',
    'Search...': 'Buscar operação...',
    'Data format': 'Formato de Dados',
    'Encryption / Encoding': 'Criptografia / Codificação',
    'Public Key': 'Chave Pública',
    'Arithmetic / Logic': 'Aritmética / Lógica',
    'Networking': 'Redes & IP',
    'Language': 'Idioma / Texto',
    'Utils': 'Utilitários',
    'Date / Time': 'Data / Hora',
    'Extractors': 'Extratores',
    'Compression': 'Compressão',
    'Hashing': 'Hashing / Resumo',
    'Code tidy': 'Formatação de Código',
    'Forensics': 'Forense',
    'Multimedia': 'Multimídia',
    'Other': 'Outros',
    'Save recipe': 'Salvar receita',
    'Load recipe': 'Carregar receita',
    'Clear recipe': 'Limpar receita',
    'Open file as input': 'Abrir arquivo como entrada',
    'Save output to file': 'Salvar saída em arquivo',
    'Copy raw output to the clipboard': 'Copiar saída para área de transferência',
    'Move output to input': 'Mover saída para entrada',
    'To Base64': 'Para Base64',
    'From Base64': 'De Base64',
    'To Hex': 'Para Hexadecimal',
    'From Hex': 'De Hexadecimal',
    'To Binary': 'Para Binário',
    'From Binary': 'De Binário',
    'URL Encode': 'Codificar URL',
    'URL Decode': 'Decodificar URL',
    'AES Encrypt': 'Criptografar AES',
    'AES Decrypt': 'Descriptografar AES',
    'RSA Encrypt': 'Criptografar RSA',
    'RSA Decrypt': 'Descriptografar RSA',
    'SHA2': 'Hash SHA-2 (SHA-256/512)',
    'MD5': 'Hash MD5',
    'Magic': 'Mágica (Auto-Detectar)',
    'JSON Beautify': 'Formatar JSON',
    'JSON Minify': 'Minificar JSON',
    'XML Beautify': 'Formatar XML',
    'Regular expression': 'Expressão Regular (Regex)',
    'Extract URLs': 'Extrair URLs',
    'Extract IP addresses': 'Extrair Endereços IP',
    'Extract email addresses': 'Extrair E-mails',
    'Extract EXIF': 'Extrair Metadados EXIF',
    'Strings': 'Extrair Textos (Strings)',
    'Entropy': 'Calcular Entropia',
    'Gunzip': 'Descompactar Gzip',
    'Gzip': 'Compactar Gzip',
    'Unzip': 'Descompactar ZIP',
    'Zip': 'Compactar ZIP',
    'Diff': 'Comparar (Diff)',
    'To Upper case': 'Para MAIÚSCULAS',
    'To Lower case': 'Para minúsculas',
    'Find / Replace': 'Localizar / Substituir',
    'Split': 'Dividir Texto',
    'Sort': 'Ordenar Linhas',
    'Unique': 'Remover Duplicadas',
    'Count occurrences': 'Contar Ocorrências',
    'Fork': 'Dividir por Linha (Fork)',
    'Merge': 'Juntar (Merge)',
    'Register': 'Registrar Variável',
    'Jump': 'Pular (Jump)',
    'Conditional Jump': 'Salto Condicional',
    'Return': 'Retornar',
    'Comment': 'Comentário',
  }

  // Padrões parciais comuns para tooltips longos do CyberChef e descrições dinâmicas
  const REGEX_REPLACEMENTS = [
    [/^Drag operations here to build a recipe/i, 'Arraste operações aqui para montar uma receita'],
    [/^Drag and drop a file here/i, 'Arraste e solte um arquivo aqui'],
    [/Converts? data (to|into) /gi, 'Converte dados para '],
    [/Converts? a /gi, 'Converte um(a) '],
    [/Encodes? /gi, 'Codifica '],
    [/Decodes? /gi, 'Decodifica '],
    [/Encrypts? /gi, 'Criptografa '],
    [/Decrypts? /gi, 'Descriptografa '],
    [/Extracts? /gi, 'Extrai '],
    [/Calculates? /gi, 'Calcula '],
    [/Generates? /gi, 'Gera '],
    [/Compresses? /gi, 'Comprime '],
    [/Decompresses? /gi, 'Descomprime '],
    [/Formats? /gi, 'Formata '],
    [/Searches? for /gi, 'Procura por '],
    [/using the specified/gi, 'usando o(a) especificado(a)'],
    [/Base64 is a group of similar binary-to-text encoding schemes/i, 'Base64 é um esquema de codificação binário-para-texto muito usado na web e transmissão de dados'],
    [/e\.g\./g, 'ex.:'],
  ]

  const LOWER_MAP = new Map()
  for (const [k, v] of Object.entries(EXACT_DICT)) {
    LOWER_MAP.set(k.trim().toLowerCase(), v)
  }

  function translateString(raw) {
    if (!raw || typeof raw !== 'string') return raw
    const trimmed = raw.trim()
    if (!trimmed) return raw

    const exact = LOWER_MAP.get(trimmed.toLowerCase())
    if (exact) {
      return raw.replace(trimmed, exact)
    }

    if (IS_CYBERCHEF) {
      let updated = raw
      for (const [re, rep] of REGEX_REPLACEMENTS) {
        updated = updated.replace(re, rep)
      }
      return updated
    }
    return raw
  }

  function translateElement(el) {
    if (!el || el.nodeType !== 1) return
    const tag = el.tagName
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'CODE' || tag === 'PRE' || tag === 'TEXTAREA') {
      return
    }

    // Traduz atributos comuns (placeholder, title, data-original-title, aria-label)
    for (const attr of ['placeholder', 'title', 'data-original-title', 'aria-label']) {
      const val = el.getAttribute && el.getAttribute(attr)
      if (val) {
        const next = translateString(val)
        if (next !== val) el.setAttribute(attr, next)
      }
    }

    // Traduz nós de texto diretos
    for (const child of el.childNodes) {
      if (child.nodeType === 3) {
        const txt = child.nodeValue
        if (txt && txt.trim().length > 1 && txt.trim().length < 260) {
          const next = translateString(txt)
          if (next !== txt) child.nodeValue = next
        }
      }
    }
  }

  function translateTree(root) {
    if (!root) return
    translateElement(root)
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
    let node = walker.nextNode()
    let count = 0
    while (node && count < 2500) {
      translateElement(node)
      node = walker.nextNode()
      count++
    }
  }

  let scheduled = false
  const pendingRoots = new Set()

  function scheduleTranslate(target) {
    pendingRoots.add(target || document.body)
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(() => {
      scheduled = false
      for (const root of pendingRoots) {
        translateTree(root)
      }
      pendingRoots.clear()
    })
  }

  function init() {
    if (!document.body) return
    if (IS_IT_TOOLS || IS_CYBERCHEF) {
      document.documentElement.lang = 'pt-BR'
    }
    translateTree(document.body)

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          for (const added of m.addedNodes) {
            if (added.nodeType === 1) scheduleTranslate(added)
          }
        } else if (m.type === 'attributes' && m.target) {
          scheduleTranslate(m.target)
        }
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['title', 'data-original-title', 'placeholder', 'aria-label'],
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()

