import Link from "next/link";

export default function TemplatesPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <h1 className="font-instrument-serif text-2xl tracking-wide text-foreground">
        Choose a template
      </h1>
      <p className="font-manrope text-sm text-muted-foreground">
        Classic, Modern, Minimal, Academic, Technical — Coming soon.
      </p>
      <Link
        href="/"
        className="font-manrope text-sm text-foreground underline hover:opacity-80"
      >
        Back to home
      </Link>
    </div>
  );
}
