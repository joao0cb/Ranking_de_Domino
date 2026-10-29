import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-xl space-y-3 p-6 text-center">
      <h1 className="text-lg font-bold text-slate-900">Página não encontrada</h1>
      <p className="text-sm text-slate-600">O endereço acessado não existe.</p>
      <Link href="/" className="btn-primary">
        Ir para os rankings
      </Link>
    </div>
  );
}
