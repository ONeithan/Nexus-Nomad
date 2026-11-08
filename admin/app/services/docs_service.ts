import Markdoc from '@markdoc/markdoc'
import { streamToString } from '../../util/docs.js'
import { getFile, getFileStatsIfExists, listDirectoryContentsRecursive } from '../utils/fs.js'
import path from 'path'
import InternalServerErrorException from '#exceptions/internal_server_error_exception'
import logger from '@adonisjs/core/services/logger'

export class DocsService {
  private docsPath = path.join(process.cwd(), 'docs')

  private static readonly DOC_ORDER: Record<string, number> = {
    'home': 1,
    '01_agua_cisterna_calculo_familiar_4p': 10,
    '02_agua_first_flush_filtro_bioareia': 11,
    '03_agua_sodis_desinfeccao_solar': 12,
    '04_agua_poco_manual_percussivo': 13,
    '05_agua_carneiro_hidraulico_sem_eletricidade': 14,
    '06_horta_200m2_planejamento_rotacao': 20,
    '07_horta_mandioca_cultivo_reserva_viva': 21,
    '08_horta_feijao_guandu_adubo_verde': 22,
    '09_horta_ora_pro_nobis_proteina_verde': 23,
    '10_pecuaria_galinhas_poedeiras_piquete': 24,
    '11_pecuaria_meliponicultura_abelhas_nativas': 25,
    '12_alimentos_banco_sementes_alho_cinzas': 26,
    '13_alimentos_conservacao_salga_charque_defumacao': 27,
    '14_energia_biogas_biodigestor_200l': 30,
    '28_eletronica_solar_offgrid_controlador_mppt': 31,
    '26_eletronica_guia_visual_multimetro_digital': 32,
    '30_computacao_do_quartzo_ao_microprocessador': 33,
    '15_construcao_sapata_corrida_pedra': 40,
    '16_construcao_adobe_taipa_pilao': 41,
    '17_construcao_argamassa_cal_areia_1_3': 42,
    '18_carpintaria_tesoura_madeira_sambladura': 43,
    '21_metalurgia_forja_carvao_fole_manual': 50,
    '23_quimica_sabao_cinzas_potassa_sebo': 51,
    '24_quimica_vinagre_alcool_destilacao': 52,
    '31_medicina_cortes_lavagem_pressao_mel': 60,
    '35_farmacia_viva_flora_medicinal_brasileira': 61,
    '39_historia_brasil_pindorama_imperio_1889': 70,
    '41_filosofia_latim_essencial_e_estoicismo': 71,
    'getting-started': 90,
    'use-cases': 91,
    'supply-depot-apps': 92,
    'drug-reference': 93,
    'community-add-ons': 94,
    'updates': 95,
    'faq': 96,
    'about': 97,
    'release-notes': 98,
  }

  async getDocs() {
    const contents = await listDirectoryContentsRecursive(this.docsPath)
    const files: Array<{ title: string; slug: string }> = []

    for (const item of contents) {
      if (item.type === 'file' && item.name.endsWith('.md')) {
        const cleaned = this.prettify(item.name)
        files.push({
          title: cleaned,
          slug: item.name.replace(/\.md$/, ''),
        })
      }
    }

    return files.sort((a, b) => {
      const orderA = DocsService.DOC_ORDER[a.slug] ?? 999
      const orderB = DocsService.DOC_ORDER[b.slug] ?? 999
      return orderA - orderB
    })
  }

  parse(content: string) {
    try {
      const ast = Markdoc.parse(content)
      const config = this.getConfig()
      const errors = Markdoc.validate(ast, config)

      // Filter out attribute-undefined errors which may be caused by emojis and special characters
      const criticalErrors = errors.filter((e) => e.error.id !== 'attribute-undefined')
      if (criticalErrors.length > 0) {
        logger.error('Markdoc validation errors:', errors.map((e) => JSON.stringify(e.error)).join(', '))
        throw new Error('Markdoc validation failed')
      }

      return Markdoc.transform(ast, config)
    } catch (error) {
      logger.error('Error parsing Markdoc content:', error)
      throw new InternalServerErrorException(`Error parsing content: ${(error as Error).message}`)
    }
  }

  async parseFile(_filename: string) {
    try {
      if (!_filename) {
        throw new Error('Filename is required')
      }

      const filename = _filename.endsWith('.md') ? _filename : `${_filename}.md`

      // Prevent path traversal — resolved path must stay within the docs directory
      const basePath = path.resolve(this.docsPath)
      const fullPath = path.resolve(path.join(this.docsPath, filename))
      if (!fullPath.startsWith(basePath + path.sep)) {
        throw new Error('Invalid document slug')
      }

      const fileExists = await getFileStatsIfExists(fullPath)
      if (!fileExists) {
        throw new Error(`File not found: ${filename}`)
      }

      const fileStream = await getFile(fullPath, 'stream')
      if (!fileStream) {
        throw new Error(`Failed to read file stream: ${filename}`)
      }
      const content = await streamToString(fileStream)
      return this.parse(content)
    } catch (error) {
      throw new InternalServerErrorException(`Error parsing file: ${(error as Error).message}`)
    }
  }

  private static readonly TITLE_OVERRIDES: Record<string, string> = {
    'home': 'Índice Geral de Manuais',
    '01_agua_cisterna_calculo_familiar_4p': 'Água: Cisterna Familiar 16.000L',
    '02_agua_first_flush_filtro_bioareia': 'Água: First Flush & Biofiltro',
    '03_agua_sodis_desinfeccao_solar': 'Água: Desinfecção Solar SODIS',
    '04_agua_poco_manual_percussivo': 'Água: Poço Manual por Percussão',
    '05_agua_carneiro_hidraulico_sem_eletricidade': 'Água: Carneiro Hidráulico PVC',
    '06_horta_200m2_planejamento_rotacao': 'Agro: Horta Familiar de 200m²',
    '07_horta_mandioca_cultivo_reserva_viva': 'Agro: Cultivo de Mandioca',
    '08_horta_feijao_guandu_adubo_verde': 'Agro: Feijão Guandu & Solo',
    '09_horta_ora_pro_nobis_proteina_verde': 'Agro: Ora-pro-nóbis Proteica',
    '10_pecuaria_galinhas_poedeiras_piquete': 'Criação: Galinhas Poedeiras',
    '11_pecuaria_meliponicultura_abelhas_nativas': 'Criação: Abelhas sem Ferrão',
    '12_alimentos_banco_sementes_alho_cinzas': 'Estoque: Banco de Sementes',
    '13_alimentos_conservacao_salga_charque_defumacao': 'Estoque: Charque e Defumação',
    '14_energia_biogas_biodigestor_200l': 'Energia: Biodigestor de Biogás',
    '28_eletronica_solar_offgrid_controlador_mppt': 'Energia: Solar Off-Grid MPPT',
    '26_eletronica_guia_visual_multimetro_digital': 'Eletrônica: Guia do Multímetro',
    '30_computacao_do_quartzo_ao_microprocessador': 'Ciência: Quartzo ao Processador',
    '15_construcao_sapata_corrida_pedra': 'Obra: Fundação em Pedra',
    '16_construcao_adobe_taipa_pilao': 'Obra: Adobe e Taipa de Pilão',
    '17_construcao_argamassa_cal_areia_1_3': 'Obra: Argamassa de Cal 1:3',
    '18_carpintaria_tesoura_madeira_sambladura': 'Carpintaria: Sambladura',
    '21_metalurgia_forja_carvao_fole_manual': 'Metalurgia: Forja a Carvão',
    '23_quimica_sabao_cinzas_potassa_sebo': 'Química: Sabão de Cinzas',
    '24_quimica_vinagre_alcool_destilacao': 'Química: Destilação & Vinagre',
    '31_medicina_cortes_lavagem_pressao_mel': 'Saúde: Cortes e Lacerações',
    '35_farmacia_viva_flora_medicinal_brasileira': 'Saúde: Farmácia Viva Brasileira',
    '39_historia_brasil_pindorama_imperio_1889': 'História: Raízes do Brasil',
    '41_filosofia_latim_essencial_e_estoicismo': 'Filosofia: Latim & Estoicismo',
    'getting-started': 'Sistema: Primeiros Passos',
    'use-cases': 'Sistema: Casos de Uso',
    'supply-depot-apps': 'Sistema: Módulos do Depósito',
    'drug-reference': 'Sistema: Guia Farmacológico',
    'community-add-ons': 'Sistema: Extensões',
    'updates': 'Sistema: Atualizações',
    'faq': 'Sistema: Perguntas Frequentes',
    'about': 'Sistema: Sobre o Projeto',
    'release-notes': 'Sistema: Notas de Versão',
  }

  private prettify(filename: string) {
    const slug = filename.replace(/\.md$/, '')
    if (DocsService.TITLE_OVERRIDES[slug]) {
      return DocsService.TITLE_OVERRIDES[slug]
    }
    // Remove hyphens, underscores, and file extension
    const cleaned = slug.replace(/_/g, ' ').replace(/-/g, ' ')
    // Convert to Title Case
    const titleCased = cleaned.replace(/\b\w/g, (char) => char.toUpperCase())
    return titleCased.charAt(0).toUpperCase() + titleCased.slice(1)
  }

  private getConfig() {
    return {
      tags: {
        callout: {
          render: 'Callout',
          attributes: {
            type: {
              type: String,
              default: 'info',
              matches: ['info', 'warning', 'error', 'success'],
            },
            title: {
              type: String,
            },
          },
        },
      },
      nodes: {
        heading: {
          render: 'Heading',
          attributes: {
            level: { type: Number, required: true },
            id: { type: String },
          },
        },
        list: {
          render: 'List',
          attributes: {
            ordered: { type: Boolean },
            start: { type: Number },
          },
        },
        list_item: {
          render: 'ListItem',
          attributes: {
            marker: { type: String },
            className: { type: String },
            class: { type: String }
          }
        },
        table: {
          render: 'Table',
        },
        thead: {
          render: 'TableHead',
        },
        tbody: {
          render: 'TableBody',
        },
        tr: {
          render: 'TableRow',
        },
        th: {
          render: 'TableHeader',
        },
        td: {
          render: 'TableCell',
        },
        paragraph: {
          render: 'Paragraph',
        },
        image: {
          render: 'Image',
          attributes: {
            src: { type: String, required: true },
            alt: { type: String },
            title: { type: String },
          },
        },
        link: {
          render: 'Link',
          attributes: {
            href: { type: String, required: true },
            title: { type: String },
          },
        },
        fence: {
          render: 'CodeBlock',
          attributes: {
            content: { type: String },
            language: { type: String },
          },
        },
        code: {
          render: 'InlineCode',
          attributes: {
            content: { type: String },
          },
        },
        hr: {
          render: 'HorizontalRule',
        },
      },
    }
  }
}
