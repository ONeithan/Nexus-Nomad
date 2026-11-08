import type { ModelVisionCapability } from '../../types/ollama.js'

const TEMPORARY_IMAGE_NOTICE =
  'As imagens são enviadas apenas nesta solicitação. Elas não são salvas e desaparecerão após o envio ou ao recarregar esta página.'

export function visionAttachmentGuidance(capability: ModelVisionCapability): string {
  if (capability === 'unsupported') {
    return 'Este modelo não aceita imagens. Escolha um modelo marcado com “Suporta imagens” em Modelos e Configurações.'
  }

  if (capability === 'unknown') {
    return `O NOMAD não pôde confirmar se este modelo aceita imagens. Você pode tentar enviar uma imagem, mas a solicitação falhará se o modelo for somente texto. ${TEMPORARY_IMAGE_NOTICE}`
  }

  return TEMPORARY_IMAGE_NOTICE
}
