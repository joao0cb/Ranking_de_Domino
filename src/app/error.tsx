"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card mx-auto max-w-xl space-y-3 p-6">
      <h1 className="text-lg font-bold text-slate-900">Não foi possível carregar os dados</h1>
      <p className="text-sm text-slate-600">
        Confira se a variável de ambiente <code className="rounded bg-slate-100 px-1">DATABASE_URL</code> está
        configurada com a string de conexão do Postgres.
      </p>
      <p className="rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs break-words text-slate-500">
        {error.message}
      </p>
      <button type="button" onClick={reset} className="btn-primary">
        Tentar novamente
      </button>
    </div>
  );
}
