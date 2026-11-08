import { Head } from '@inertiajs/react'
import SettingsLayout from '~/layouts/SettingsLayout'

export default function LegalPage() {
  return (
    <SettingsLayout>
      <Head title="Avisos Legais | Project NOMAD" />
      <div className="xl:pl-72 w-full">
        <main className="px-12 py-6 max-w-4xl">
          <h1 className="text-4xl font-semibold mb-8">Avisos Legais</h1>

          {/* Contrato de Licença */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Contrato de Licença</h2>
            <p className="text-text-primary mb-3">Copyright 2024-2026 Crosstalk Solutions, LLC &amp; colaboradores de código aberto</p>
            <p className="text-text-primary mb-3">
              Licenciado sob a Licença Apache, Versão 2.0 (a &quot;Licença&quot;); você não pode
              utilizar este software exceto em conformidade com a Licença. Você pode obter uma
              cópia oficial da Licença em:
            </p>
            <p className="text-text-primary mb-3">
              <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://www.apache.org/licenses/LICENSE-2.0</a>
            </p>
            <p className="text-text-primary">
              Salvo quando exigido pela legislação aplicável ou acordado por escrito, o software
              distribuído sob a Licença é fornecido &quot;NO ESTADO EM QUE SE ENCONTRA&quot;
              (&quot;AS IS&quot;), SEM GARANTIAS OU CONDIÇÕES DE QUALQUER TIPO, expressas ou
              implícitas. Consulte a Licença para verificar o texto específico que rege as
              permissões e limitações sob a Licença.
            </p>
          </section>

          {/* Software de Terceiros */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Atribuição de Software de Terceiros</h2>
            <p className="text-text-primary mb-4">
              O Project NOMAD&trade; integra os seguintes projetos de código aberto. Agradecemos
              aos seus desenvolvedores e comunidades:
            </p>
            <ul className="space-y-3 text-text-primary">
              <li>
                <strong>Kiwix</strong> - Leitor offline da Wikipédia e conteúdos educacionais (Licença GPL-3.0)
                <br />
                <a href="https://kiwix.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://kiwix.org</a>
              </li>
              <li>
                <strong>Kolibri</strong> - Plataforma de aprendizagem offline da Learning Equality (Licença MIT)
                <br />
                <a href="https://learningequality.org/kolibri" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://learningequality.org/kolibri</a>
              </li>
              <li>
                <strong>Ollama</strong> - Runtime local para grandes modelos de linguagem (Licença MIT)
                <br />
                <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://ollama.com</a>
              </li>
              <li>
                <strong>CyberChef</strong> - Conjunto de ferramentas para análise e codificação de dados por GCHQ (Licença Apache 2.0)
                <br />
                <a href="https://github.com/gchq/CyberChef" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://github.com/gchq/CyberChef</a>
              </li>
              <li>
                <strong>FlatNotes</strong> - Aplicativo auto-hospedado de anotações (Licença MIT)
                <br />
                <a href="https://github.com/dullage/flatnotes" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://github.com/dullage/flatnotes</a>
              </li>
              <li>
                <strong>Qdrant</strong> - Mecanismo de busca vetorial para a base de conhecimento de IA (Licença Apache 2.0)
                <br />
                <a href="https://github.com/qdrant/qdrant" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://github.com/qdrant/qdrant</a>
              </li>
            </ul>
          </section>

          {/* Declaração de Privacidade */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Declaração de Privacidade</h2>
            <p className="text-text-primary mb-3">
              O Project NOMAD foi projetado tendo a privacidade como princípio fundamental:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-primary">
              <li><strong>Zero Telemetria:</strong> O NOMAD não coleta, transmite nem armazena quaisquer dados de uso, métricas ou telemetria.</li>
              <li><strong>Local em Primeiro Lugar:</strong> Todos os seus dados, conteúdos baixados, conversas com a IA e anotações permanecem no seu dispositivo.</li>
              <li><strong>Sem Necessidade de Contas:</strong> O NOMAD opera sem contas de usuário ou autenticação obrigatória por padrão.</li>
              <li><strong>Rede Opcional:</strong> A conexão com a internet só é necessária para baixar conteúdos ou atualizações. Todos os recursos instalados funcionam totalmente offline.</li>
            </ul>
          </section>

          {/* Isenção de Responsabilidade de Conteúdo */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Isenção de Responsabilidade de Conteúdo</h2>
            <p className="text-text-primary mb-3">
              O Project NOMAD fornece ferramentas para baixar e acessar conteúdos de fontes de
              terceiros, incluindo Wikipédia, Wikilivros, referências médicas, plataformas
              educacionais e outros recursos disponíveis publicamente.
            </p>
            <p className="text-text-primary mb-3">
              A Crosstalk Solutions, LLC e os autores de código aberto não criam, controlam,
              verificam nem garantem a precisão, integridade ou confiabilidade de qualquer conteúdo
              de terceiros. A inclusão de qualquer conteúdo não constitui endosso.
            </p>
            <p className="text-text-primary">
              Os usuários são responsáveis por avaliar a adequação e a precisão de qualquer
              conteúdo que baixarem e utilizarem.
            </p>
          </section>

          {/* Isenção de Responsabilidade Médica */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Isenção de Responsabilidade Médica e de Emergência</h2>
            <p className="text-text-primary mb-3">
              Alguns conteúdos disponíveis por meio do NOMAD incluem referências médicas, guias de
              primeiros socorros e informações de preparação para emergências. Este conteúdo é
              fornecido apenas para fins informativos gerais.
            </p>
            <p className="text-text-primary mb-3 font-semibold">
              Estas informações NÃO substituem aconselhamento, diagnóstico ou tratamento médico profissional.
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-primary mb-3">
              <li>Procure sempre a orientação de profissionais de saúde qualificados em caso de dúvidas sobre condições médicas.</li>
              <li>Nunca ignore orientação médica profissional nem adie a busca por atendimento devido a algo que leu no conteúdo offline.</li>
              <li>Em caso de emergência médica, acione imediatamente os serviços de emergência locais, se disponíveis.</li>
              <li>Informações médicas podem ficar desatualizadas. Sempre que possível, confirme informações críticas em fontes profissionais atualizadas.</li>
            </ul>
          </section>

          {/* Armazenamento de Dados */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Armazenamento de Dados</h2>
            <p className="text-text-primary mb-3">
              Todos os dados associados ao Project NOMAD são armazenados localmente no seu dispositivo:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-primary">
              <li><strong>Diretório de Instalação:</strong> /opt/project-nomad</li>
              <li><strong>Conteúdo Baixado:</strong> /opt/project-nomad/storage</li>
              <li><strong>Dados dos Aplicativos:</strong> Armazenados em volumes Docker no seu sistema local</li>
            </ul>
            <p className="text-text-primary mt-3">
              Você mantém controle total sobre os seus dados. Desinstalar o NOMAD ou excluir esses
              diretórios removerá permanentemente todos os dados associados.
            </p>
          </section>

        </main>
      </div>
    </SettingsLayout>
  )
}
