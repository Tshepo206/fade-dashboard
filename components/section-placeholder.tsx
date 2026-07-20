import { Construction } from "lucide-react";

type SectionPlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionPlaceholder({
  eyebrow,
  title,
  description,
}: SectionPlaceholderProps) {
  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        <header>
          <p className="text-sm font-medium text-purple-300">{eyebrow}</p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            {title}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
            {description}
          </p>
        </header>

        <section className="mt-10 rounded-3xl border border-zinc-800 bg-[#080808] p-8 md:p-12">
          <div className="flex max-w-xl flex-col items-start">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10">
              <Construction className="h-6 w-6 text-purple-300" />
            </div>

            <h2 className="mt-6 text-xl font-semibold">
              This workspace is ready
            </h2>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              We will move the existing working functionality into this page
              during the next stage of the GoodKeeper V2 refactor.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}