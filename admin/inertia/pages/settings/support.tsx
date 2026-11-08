import { Head } from '@inertiajs/react'
import { IconExternalLink } from '@tabler/icons-react'
import SettingsLayout from '~/layouts/SettingsLayout'

export default function SupportPage() {
  return (
    <SettingsLayout>
      <Head title="Apoie o Projeto | Project NOMAD" />
      <div className="xl:pl-72 w-full">
        <main className="px-12 py-6 max-w-4xl">
          <h1 className="text-4xl font-semibold mb-4">Apoie o Projeto</h1>
          <p className="text-text-muted mb-10 text-lg">
            O Project NOMAD é 100% gratuito e de código aberto — sem assinaturas, sem cobranças
            ocultas e sem pegadinhas. Esta edição em Português Brasileiro (<strong>Nexus NOMAD</strong>) é
            mantida pela comunidade sobre o projeto original da <strong>Crosstalk Solutions</strong>.
            Se você deseja apoiar a continuidade e evolução do ecossistema, confira abaixo como ajudar.
          </p>

          {/* Fork PT-BR Nexus NOMAD */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-3">Edição Brasileira — Nexus NOMAD</h2>
            <p className="text-text-muted mb-4">
              O fork <strong>ONeithan/Nexus-Nomad</strong> traz tradução nativa para Português
              Brasileiro (PT-BR), ajustes de experiência local e melhorias voltadas à comunidade
              lusófona. Deixe uma estrela no repositório e participe com sugestões ou correções!
            </p>
            <a
              href="https://github.com/ONeithan/Nexus-Nomad"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-desert-green hover:opacity-90 text-white font-semibold rounded-lg transition-opacity"
            >
              Ver ONeithan/Nexus-Nomad no GitHub
              <IconExternalLink size={18} />
            </a>
          </section>

          {/* Ko-fi / Upstream Project NOMAD */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-3">Apoie o Projeto Oficial (Crosstalk Solutions)</h2>
            <p className="text-text-muted mb-4">
              O Project NOMAD original é desenvolvido pela equipe da{' '}
              <strong>Crosstalk Solutions</strong>. Cada contribuição ajuda a financiar o
              desenvolvimento contínuo, infraestrutura de distribuição e novos pacotes de conteúdo
              offline para toda a comunidade.
            </p>
            <a
              href="https://ko-fi.com/crosstalk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF5E5B] hover:bg-[#e54e4b] text-white font-semibold rounded-lg transition-colors"
            >
              Apoiar no Ko-fi
              <IconExternalLink size={18} />
            </a>
          </section>

          {/* Outras Formas de Ajudar */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">Outras Formas de Ajudar</h2>
            <ul className="space-y-2 text-text-muted">
              <li>
                <a
                  href="https://github.com/ONeithan/Nexus-Nomad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Deixe uma estrela no fork PT-BR (ONeithan/Nexus-Nomad)
                </a>
                {' '}e no{' '}
                <a
                  href="https://github.com/Crosstalk-Solutions/project-nomad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  repositório oficial (Crosstalk-Solutions/project-nomad)
                </a>
                {' '}— isso ajuda mais pessoas a descobrirem o NOMAD
              </li>
              <li>
                <a
                  href="https://github.com/ONeithan/Nexus-Nomad/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Relate problemas de tradução ou sugira melhorias no fork
                </a>
                {' '}ou{' '}
                <a
                  href="https://github.com/Crosstalk-Solutions/project-nomad/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  abra issues no projeto oficial
                </a>
              </li>
              <li>Compartilhe o NOMAD com quem possa se beneficiar — a recomendação direta é a melhor divulgação</li>
              <li>
                <a
                  href="https://discord.com/invite/crosstalksolutions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Participe da comunidade oficial no Discord
                </a>
                {' '}— troque ideias, mostre seu servidor e ajude outros usuários
              </li>
            </ul>
          </section>

        </main>
      </div>
    </SettingsLayout>
  )
}
