import Uppy from '@uppy/core'
import Dashboard from '@uppy/react/dashboard'
import XHRUpload from '@uppy/xhr-upload'
import '@uppy/core/css/style.min.css'
import '@uppy/dashboard/css/style.min.css'
import { useEffect, useRef, useState } from 'react'

interface ZimUploaderProps {
  onUploadComplete: (added: number) => void
  existingFilenames: string[]
}

export default function ZimUploader({ onUploadComplete, existingFilenames }: ZimUploaderProps) {
  const existingFilenamesRef = useRef(existingFilenames)
  useEffect(() => {
    existingFilenamesRef.current = existingFilenames
  }, [existingFilenames])

  // Keep the latest callback in a ref so the Uppy lifecycle effect below does
  // not depend on it. The parent passes a new inline function on every render,
  // and if that identity were in the effect deps, a re-render mid-upload (e.g.
  // a window-focus refetch) would tear down and `uppy.destroy()` the instance,
  // aborting the in-flight upload.
  const onUploadCompleteRef = useRef(onUploadComplete)
  useEffect(() => {
    onUploadCompleteRef.current = onUploadComplete
  }, [onUploadComplete])

  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles: 5,
        allowedFileTypes: ['.zim'],
      },
      autoProceed: false,
    }).use(XHRUpload, {
      endpoint: '/api/zim/upload',
      fieldName: 'file',
      onAfterResponse: (xhr) => {
        if (xhr.status >= 400) {
          let message = 'Falha no envio'
          try {
            const body = JSON.parse(xhr.responseText)
            if (body?.message) message = body.message
          } catch {}
          throw new Error(message)
        }
      },
    })
  )

  useEffect(() => {
    const handleFileAdded = (file: { id: string; name: string }) => {
      if (existingFilenamesRef.current.includes(file.name)) {
        uppy.removeFile(file.id)
        uppy.info('Já existe um arquivo ZIM com esse nome', 'error', 6000)
        return
      }

      const isWikipedia = (name: string) => name.startsWith('wikipedia_en_')
      if (isWikipedia(file.name)) {
        const alreadyQueued = uppy.getFiles().some((f) => f.id !== file.id && isWikipedia(f.name))
        if (alreadyQueued) {
          uppy.removeFile(file.id)
          uppy.info('Apenas um arquivo da Wikipédia pode ser enviado por vez', 'error', 6000)
        }
      }
    }
    const handleComplete = (result: {
      successful?: Array<{ response?: { body?: unknown } }>
      failed?: Array<unknown>
    }) => {
      // Uppy emits `complete` even when uploads fail or are aborted. Only treat
      // the run as a success when nothing failed — otherwise leave the uploader
      // open so the Dashboard can surface the error instead of closing it with a
      // false "Upload complete" toast.
      if ((result.failed?.length ?? 0) > 0) return
      const added = (result.successful ?? []).reduce((sum, f) => {
        const body = f.response?.body as { added?: number } | undefined
        return sum + (body?.added ?? 0)
      }, 0)
      onUploadCompleteRef.current(added)
    }
    uppy.on('file-added', handleFileAdded)
    uppy.on('complete', handleComplete)
    return () => {
      uppy.off('file-added', handleFileAdded)
      uppy.off('complete', handleComplete)
      uppy.destroy()
    }
  }, [uppy])

  return (
    <Dashboard
      uppy={uppy}
      width="100%"
      height={300}
      note="Apenas arquivos ZIM. Arquivos grandes (até 20 GB) são suportados. Para melhores resultados, envie da mesma máquina ou em rede local (LAN) estável. Arquivos maiores podem ser copiados diretamente para o volume de armazenamento."
    />
  )
}
