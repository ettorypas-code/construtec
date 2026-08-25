"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-card border border-ink-200 bg-surface">
      <ErrorState
        title="Não foi possível carregar esta tela"
        description="O erro foi registrado. Tente novamente; se continuar, recarregue a página."
        action={
          <Button variant="outline" onClick={reset}>
            Tentar novamente
          </Button>
        }
      />
    </div>
  );
}
