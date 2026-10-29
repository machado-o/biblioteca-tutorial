import type { ReactNode } from "react";

export function Page({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section>
    <title>{title} · Biblioteca</title>
    <div className="page-header"><h1>{title}</h1><p>{description}</p></div>
    {children}
  </section>;
}
