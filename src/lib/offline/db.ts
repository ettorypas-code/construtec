/**
 * Fila de operações pendentes, no aparelho.
 *
 * Existe por causa de onde o trabalho acontece: apartamento vazio, prédio
 * recém-entregue, muitas vezes garagem ou andar alto sem laje pronta. Sinal
 * ruim ali é a regra. Sem fila, cada toque perdido é um item que precisa ser
 * reavaliado — e quando ele percebe, já saiu do imóvel.
 *
 * IndexedDB e não localStorage porque a fila guarda foto: Blob binário, que
 * localStorage só aceitaria em base64, inflando 33% e estourando a cota de
 * 5 MB em meia dúzia de imagens.
 *
 * Toda função aqui falha em silêncio devolvendo vazio. Navegador em modo
 * privado ou com armazenamento bloqueado não pode derrubar a vistoria — nesse
 * caso o app volta a se comportar como antes, exigindo sinal.
 */

const NOME_BANCO = "construtec-offline";
const LOJA = "fila";
const VERSAO = 1;

export type OperacaoPendente =
  | {
      tipo: "status";
      itemId: string;
      inspectionId: string;
      roomId: string;
      status: string;
    }
  | {
      tipo: "foto";
      itemId: string;
      inspectionId: string;
      roomId: string;
      arquivo: Blob;
      nomeArquivo: string;
    };

export type ItemDaFila = OperacaoPendente & {
  id: number;
  criadoEm: number;
  tentativas: number;
};

let conexao: Promise<IDBDatabase | null> | null = null;

function abrir(): Promise<IDBDatabase | null> {
  if (conexao) return conexao;

  conexao = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }

    let requisicao: IDBOpenDBRequest;
    try {
      requisicao = indexedDB.open(NOME_BANCO, VERSAO);
    } catch {
      resolve(null);
      return;
    }

    requisicao.onupgradeneeded = () => {
      const banco = requisicao.result;
      if (!banco.objectStoreNames.contains(LOJA)) {
        banco.createObjectStore(LOJA, { keyPath: "id", autoIncrement: true });
      }
    };
    requisicao.onsuccess = () => resolve(requisicao.result);
    requisicao.onerror = () => resolve(null);
    requisicao.onblocked = () => resolve(null);
  });

  return conexao;
}

async function comLoja<T>(
  modo: IDBTransactionMode,
  executar: (loja: IDBObjectStore) => IDBRequest,
  padrao: T,
): Promise<T> {
  const banco = await abrir();
  if (!banco) return padrao;

  return new Promise((resolve) => {
    try {
      const transacao = banco.transaction(LOJA, modo);
      const requisicao = executar(transacao.objectStore(LOJA));
      requisicao.onsuccess = () => resolve(requisicao.result as T);
      requisicao.onerror = () => resolve(padrao);
      transacao.onerror = () => resolve(padrao);
      transacao.onabort = () => resolve(padrao);
    } catch {
      resolve(padrao);
    }
  });
}

export async function enfileirar(operacao: OperacaoPendente): Promise<void> {
  await comLoja(
    "readwrite",
    (loja) => loja.add({ ...operacao, criadoEm: Date.now(), tentativas: 0 }),
    undefined,
  );
}

export async function listarFila(): Promise<ItemDaFila[]> {
  const itens = await comLoja<ItemDaFila[]>("readonly", (loja) => loja.getAll(), []);
  // Ordem de chegada importa: duas marcações do mesmo item precisam ser
  // aplicadas na sequência em que ele tocou, ou vence a errada.
  return itens.sort((a, b) => a.criadoEm - b.criadoEm);
}

export async function removerDaFila(id: number): Promise<void> {
  await comLoja("readwrite", (loja) => loja.delete(id), undefined);
}

export async function marcarTentativa(item: ItemDaFila): Promise<void> {
  await comLoja(
    "readwrite",
    (loja) => loja.put({ ...item, tentativas: item.tentativas + 1 }),
    undefined,
  );
}
