"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  enfileirar,
  listarFila,
  marcarTentativa,
  removerDaFila,
  type ItemDaFila,
  type OperacaoPendente,
} from "@/lib/offline/db";
import { attachItemPhotosAction, setChecklistItemAction } from "@/app/(app)/vistorias/actions";

/**
 * Sincronização do trabalho de campo.
 *
 * A regra que organiza tudo aqui: **falha de rede nunca desfaz um toque**. Se a
 * chamada não chega ao servidor, a operação vai para a fila no aparelho e a
 * tela continua mostrando o que a pessoa marcou. Ela precisa poder terminar a
 * vistoria e sair do imóvel sem depender de sinal — voltar depois não é uma
 * opção quando as chaves já foram entregues.
 *
 * A distinção que importa é entre **falha de rede** e **recusa do servidor**.
 * Rede caiu: enfileira e mantém na tela. Servidor respondeu "esse item não
 * existe": aí é erro de verdade, e insistir só empilharia lixo — some da fila e
 * avisa.
 */

type ValorDoContexto = {
  /** Marcações que ainda não chegaram ao servidor, por itemId. */
  statusPendente: Record<string, string>;
  /** Fotos enfileiradas por itemId, para a contagem na tela. */
  fotosPendentes: Record<string, number>;
  /** Total na fila. Zero quando tudo subiu. */
  pendentes: number;
  online: boolean;
  sincronizando: boolean;
  /** Tenta agora; se a rede falhar, enfileira e devolve `enfileirado`. */
  enviarStatus: (op: Extract<OperacaoPendente, { tipo: "status" }>) => Promise<Resultado>;
  enviarFoto: (op: Extract<OperacaoPendente, { tipo: "foto" }>) => Promise<Resultado>;
  sincronizar: () => void;
};

type Resultado = { ok: true; enfileirado: boolean } | { ok: false; erro: string };

const Contexto = createContext<ValorDoContexto | null>(null);

/**
 * Conexão como sistema externo, e não como estado copiado.
 *
 * `navigator.onLine` é do navegador, não do React: assinar é o jeito de ler
 * sem duplicar a fonte da verdade — e sem o setState em efeito que dispara
 * renderização em cascata.
 */
function assinarConexao(aoMudar: () => void): () => void {
  window.addEventListener("online", aoMudar);
  window.addEventListener("offline", aoMudar);
  return () => {
    window.removeEventListener("online", aoMudar);
    window.removeEventListener("offline", aoMudar);
  };
}

function lerConexao(): boolean {
  return navigator.onLine;
}

/** Falha de rede, não recusa do servidor. Só esta merece fila. */
function eFalhaDeRede(erro: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  // Server action e fetch abortados por rede chegam como TypeError.
  return erro instanceof TypeError;
}

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [fila, setFila] = useState<ItemDaFila[]>([]);
  const online = useSyncExternalStore(assinarConexao, lerConexao, () => true);
  const [sincronizando, setSincronizando] = useState(false);
  const drenando = useRef(false);

  const recarregar = useCallback(async () => {
    setFila(await listarFila());
  }, []);

  const sincronizar = useCallback(() => {
    if (drenando.current) return;
    drenando.current = true;
    setSincronizando(true);

    void (async () => {
      try {
        for (const item of await listarFila()) {
          // Uma operação que já falhou muitas vezes por recusa do servidor não
          // vai passar na próxima. Sai da fila para não travar as seguintes.
          if (item.tentativas >= 5) {
            await removerDaFila(item.id);
            continue;
          }

          try {
            const resultado = await executar(item);
            if (resultado === "sucesso" || resultado === "recusado") {
              await removerDaFila(item.id);
            } else {
              // Rede ainda fora: para aqui e mantém a ordem para a próxima vez.
              break;
            }
          } catch {
            await marcarTentativa(item);
            break;
          }
        }
      } finally {
        drenando.current = false;
        setSincronizando(false);
        await recarregar();
      }
    })();
  }, [recarregar]);

  useEffect(() => {
    window.addEventListener("online", sincronizar);
    // `online` do navegador mente com frequência (rede associada mas sem
    // internet, portaria de prédio com captive portal). Uma tentativa periódica
    // cobre o caso em que o evento não vem ou vem cedo demais.
    const relogio = window.setInterval(sincronizar, 20_000);

    // Fora do corpo do efeito de propósito: `sincronizar` mexe em estado, e
    // chamá-lo direto aqui dispara renderização em cascata na montagem. Ele
    // também é quem carrega a fila do aparelho para a tela, no `finally`.
    const primeira = window.setTimeout(sincronizar, 0);

    return () => {
      window.removeEventListener("online", sincronizar);
      window.clearInterval(relogio);
      window.clearTimeout(primeira);
    };
  }, [sincronizar]);

  const enviar = useCallback(
    async (operacao: OperacaoPendente): Promise<Resultado> => {
      try {
        const resultado = await executarOperacao(operacao);
        if (resultado.ok) return { ok: true, enfileirado: false };
        return { ok: false, erro: resultado.erro };
      } catch (erro) {
        if (!eFalhaDeRede(erro)) {
          return { ok: false, erro: "Não foi possível salvar. Tente de novo." };
        }
        await enfileirar(operacao);
        await recarregar();
        return { ok: true, enfileirado: true };
      }
    },
    [recarregar],
  );

  const statusPendente: Record<string, string> = {};
  const fotosPendentes: Record<string, number> = {};
  for (const item of fila) {
    if (item.tipo === "status") statusPendente[item.itemId] = item.status;
    else fotosPendentes[item.itemId] = (fotosPendentes[item.itemId] ?? 0) + 1;
  }

  return (
    <Contexto.Provider
      value={{
        statusPendente,
        fotosPendentes,
        pendentes: fila.length,
        online,
        sincronizando,
        enviarStatus: enviar,
        enviarFoto: enviar,
        sincronizar,
      }}
    >
      {children}
    </Contexto.Provider>
  );
}

/**
 * Executa a operação de verdade.
 *
 * Devolve "rede" quando não chegou ao servidor e "recusado" quando chegou e foi
 * negada — a fila trata os dois de forma oposta.
 */
async function executar(operacao: OperacaoPendente): Promise<"sucesso" | "recusado" | "rede"> {
  try {
    const resultado = await executarOperacao(operacao);
    return resultado.ok ? "sucesso" : "recusado";
  } catch (erro) {
    if (eFalhaDeRede(erro)) return "rede";
    throw erro;
  }
}

async function executarOperacao(
  operacao: OperacaoPendente,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  if (operacao.tipo === "status") {
    const resultado = await setChecklistItemAction({
      itemId: operacao.itemId,
      inspectionId: operacao.inspectionId,
      roomId: operacao.roomId,
      status: operacao.status,
    });
    return resultado.ok ? { ok: true } : { ok: false, erro: resultado.error };
  }

  const corpo = new FormData();
  corpo.append("file", operacao.arquivo, operacao.nomeArquivo);
  corpo.append("folder", `vistoria-${operacao.inspectionId}`);

  const resposta = await fetch("/api/upload", { method: "POST", body: corpo });
  const dados = (await resposta.json()) as { key?: string; error?: string };
  if (!resposta.ok || !dados.key) {
    return { ok: false, erro: dados.error ?? "Falha no envio da foto." };
  }

  const anexo = await attachItemPhotosAction({
    itemId: operacao.itemId,
    inspectionId: operacao.inspectionId,
    roomId: operacao.roomId,
    keys: [dados.key],
  });
  return anexo.ok ? { ok: true } : { ok: false, erro: anexo.error };
}

export function useOffline(): ValorDoContexto {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useOffline precisa estar dentro de OfflineProvider.");
  return contexto;
}
