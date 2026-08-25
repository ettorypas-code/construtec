"use client";

import { CloudOff, Loader2, RefreshCw } from "lucide-react";
import { useOffline } from "./offline-provider";

/**
 * Estado da sincronização.
 *
 * Só aparece quando há algo a dizer. Um indicador permanente de "tudo certo"
 * vira ruído e deixa de ser lido — e é justamente quando ele mudar que precisa
 * ser notado.
 *
 * A pergunta que ele responde é uma só, e é prática: **posso ir embora?** Por
 * isso mostra a contagem do que falta subir, não um ícone de nuvem genérico.
 * Sair do imóvel com trabalho na fila é seguro (fica no aparelho), mas apagar o
 * app ou trocar de celular antes de sincronizar não é.
 */
export function SyncBadge() {
  const { pendentes, online, sincronizando, sincronizar } = useOffline();

  if (pendentes === 0 && online) return null;

  if (pendentes === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-control bg-warning-soft px-2.5 py-1.5 text-xs font-medium text-warning">
        <CloudOff className="size-3.5" />
        Sem conexão
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={sincronizar}
      disabled={sincronizando}
      title={
        online
          ? "Enviar agora o que ainda não subiu"
          : "Salvo no aparelho. Sobe sozinho quando o sinal voltar."
      }
      className="inline-flex items-center gap-1.5 rounded-control bg-warning-soft px-2.5 py-1.5 text-xs font-medium text-warning transition-opacity hover:opacity-80 disabled:opacity-60"
    >
      {sincronizando ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : online ? (
        <RefreshCw className="size-3.5" />
      ) : (
        <CloudOff className="size-3.5" />
      )}
      {pendentes} {pendentes === 1 ? "pendente" : "pendentes"}
    </button>
  );
}

/**
 * Aviso dentro da tela de vistoria.
 *
 * O selo da barra superior é discreto de propósito, e num celular segurado com
 * uma mão só, de pé, discreto passa despercebido. Aqui a mensagem é inteira,
 * porque é onde o trabalho está sendo feito.
 */
export function SyncNotice() {
  const { pendentes, online } = useOffline();

  if (pendentes === 0 && online) return null;

  return (
    <div className="flex items-start gap-2.5 rounded-card border border-warning/25 bg-warning-soft px-3.5 py-3">
      <CloudOff className="mt-0.5 size-4 shrink-0 text-warning" />
      <div className="min-w-0 text-sm leading-relaxed text-ink-700">
        {pendentes > 0 ? (
          <>
            <span className="font-medium text-ink-900">
              {pendentes} {pendentes === 1 ? "alteração" : "alterações"} no aparelho
            </span>{" "}
            {online
              ? "— enviando agora."
              : "— pode continuar trabalhando. Sobe sozinho quando o sinal voltar."}
          </>
        ) : (
          <>
            <span className="font-medium text-ink-900">Sem conexão.</span> Pode continuar: o
            que você marcar fica salvo no aparelho e sobe quando o sinal voltar.
          </>
        )}
      </div>
    </div>
  );
}
