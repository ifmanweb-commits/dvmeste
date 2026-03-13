import { HeroBlock } from "@/components/home/HeroBlock";
import { TrustBlock } from "@/components/home/TrustBlock";
import { ValuesBlock } from "@/components/home/ValuesBlock";
import { HowBlock } from "@/components/home/HowBlock";
import { CatalogBlock } from "@/components/home/CatalogBlock";
import { ForPsychologistsBlock } from "@/components/home/ForPsychologistsBlock";
import { LibraryBlock } from "@/components/home/LibraryBlock";
import { CtaBlock } from "@/components/home/CtaBlock";

export function HomeFallback() {
  return (
    <div>
      <HeroBlock />
      <TrustBlock />
      <ValuesBlock />
      <HowBlock />
      <CatalogBlock />
      <ForPsychologistsBlock />
      <LibraryBlock />
      <CtaBlock />
    </div>
  );
}
