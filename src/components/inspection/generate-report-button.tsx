"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { generateReportAction } from "@/app/(app)/vistorias/actions-report";

/**
 * Geração do documento.
 *
 * Cada geração cria uma versão nova em vez de sobrescrever: se o relatório já
 * foi enviado ao cliente, o arquivo daquele envio precisa continuar existindo
 * exatamente como estava.
 */
export function GenerateReportButton({
  inspectionId,
  hasPrevious,
}: {
  inspectionId: string;
  hasPrevious: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <FormError message={error} />

      <Button
        size="lg"
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await generateReportAction({ inspectionId });
            if (result.ok) {
              toast("Documento gerado.");
              router.refresh();
              window.open(`/api/relatorios/${result.data.reportId}/pdf`, "_blank");
            } else {
              setError(result.error);
            }
          })
        }
      >
        <FileDown className="size-4" />
        {hasPrevious ? "Gerar nova versão" : "Gerar documento"}
      </Button>

      {hasPrevious ? (
        <p className="text-xs text-ink-500">
          As versões anteriores continuam disponíveis abaixo.
        </p>
      ) : null}
    </div>
  );
}
