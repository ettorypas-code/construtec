import type { Metadata } from "next";
import { getCompanySettings } from "@/lib/services/catalog";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Como os dados pessoais são coletados, usados e protegidos.",
  alternates: { canonical: "/privacidade" },
};

/**
 * Renderizada por requisição, não no build.
 *
 * A página cita nome, CNPJ e canal de contato vindos de `CompanySettings`. Se
 * fosse estática, dois problemas: o build passaria a depender do banco estar de
 * pé (um deploy falharia por indisponibilidade momentânea do Postgres), e
 * corrigir o e-mail de contato em Configurações não atualizaria o documento
 * legal até o próximo deploy.
 */
export const dynamic = "force-dynamic";

/**
 * Política de privacidade.
 *
 * Escrita em linguagem direta e limitada ao que o sistema realmente faz. Não
 * promete o que não é implementado: não há rastreamento de terceiros, não há
 * compartilhamento e não há transferência internacional.
 */
export default async function PrivacyPage() {
  const company = await getCompanySettings();
  const contact = company.email ?? company.phone ?? "o canal de contato informado no site";

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
        Política de privacidade
      </h1>
      <p className="mt-2 text-sm text-ink-500">
        Última atualização: {new Date().toLocaleDateString("pt-BR")}
      </p>

      <div className="mt-8 space-y-8">
        <Section title="Quem trata seus dados">
          <p>
            Os dados informados neste site são tratados por {company.name}
            {company.document ? `, inscrito sob ${company.document}` : ""}. Para qualquer
            solicitação relacionada aos seus dados, use {contact}.
          </p>
        </Section>

        <Section title="Quais dados são coletados">
          <p>
            No formulário de contato: nome, telefone/WhatsApp, e-mail (opcional) e a mensagem que
            você escrever. Durante a prestação do serviço, também são registrados os dados do
            imóvel, fotografias dos ambientes vistoriados e as informações necessárias para emitir
            documentos e cobrar.
          </p>
          <p>
            Não usamos cookies de rastreamento, não há pixel de rede social e não há ferramenta de
            análise de comportamento neste site.
          </p>
        </Section>

        <Section title="Para que os dados são usados">
          <ul className="list-disc space-y-1 pl-5">
            <li>Entrar em contato e responder à sua solicitação;</li>
            <li>Elaborar orçamento e proposta comercial;</li>
            <li>Executar o serviço contratado e emitir os documentos correspondentes;</li>
            <li>Cumprir obrigações legais, fiscais e de guarda de documentos.</li>
          </ul>
          <p>
            A base legal é o seu consentimento no formulário e, após a contratação, a execução do
            contrato e o cumprimento de obrigação legal.
          </p>
        </Section>

        <Section title="Com quem os dados são compartilhados">
          <p>
            Com ninguém, salvo quando indispensável para executar o serviço que você contratou
            (por exemplo, apresentar o relatório de vistoria à construtora, a seu pedido) ou quando
            exigido por lei ou ordem judicial. Os dados não são vendidos nem usados para
            publicidade de terceiros.
          </p>
        </Section>

        <Section title="Por quanto tempo ficam guardados">
          <p>
            Dados de contato de solicitações não convertidas são mantidos por até 24 meses.
            Registros de serviços prestados, documentos emitidos e informações fiscais são
            mantidos pelos prazos legais aplicáveis, ainda que você solicite exclusão — nesse
            caso, o uso fica restrito ao cumprimento da obrigação legal.
          </p>
        </Section>

        <Section title="Seus direitos">
          <p>
            Você pode solicitar, a qualquer momento: confirmação de tratamento, acesso aos dados,
            correção de dados incompletos ou desatualizados, anonimização ou exclusão de dados
            desnecessários, portabilidade, informação sobre compartilhamento e revogação do
            consentimento.
          </p>
          <p>
            Basta enviar o pedido para {contact}. Respondemos em até 15 dias. Se algum dado não
            puder ser excluído por obrigação legal de guarda, informamos qual e por quê.
          </p>
        </Section>

        <Section title="Segurança">
          <p>
            O acesso ao sistema é protegido por autenticação individual. Fotografias e documentos
            de vistoria ficam em armazenamento privado, acessível apenas por sessão autenticada —
            não são publicados em endereços abertos. Registros de acesso a dados de clientes são
            mantidos para auditoria.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-ink-900">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-ink-600">{children}</div>
    </section>
  );
}
