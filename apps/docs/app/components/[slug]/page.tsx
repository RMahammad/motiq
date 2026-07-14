import Link from "next/link";
import { notFound } from "next/navigation";
import { CATALOG, BY_SLUG } from "../_registry";
import { ComponentStage } from "../../_components/component-stage";

export function generateStaticParams() {
  return CATALOG.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = BY_SLUG.get(slug);
  return { title: entry ? `${entry.name} — @scope/ui` : "Component — @scope/ui" };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = BY_SLUG.get(slug);
  if (!entry) notFound();
  const { name, category, tagline, code, facts, Demo } = entry;

  return (
    <article className="wrap article">
      <div className="article__head">
        <p className="crumb">
          <Link href="/">@scope/ui</Link> / {category} / {name}
        </p>
        <h1>{name}</h1>
        <p>{tagline}</p>
      </div>
      <ComponentStage code={code} facts={facts}>
        <Demo />
      </ComponentStage>
      <p className="crumb">
        <Link href="/#catalog">← All components</Link>
      </p>
    </article>
  );
}
