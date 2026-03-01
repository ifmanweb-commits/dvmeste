import PsychologistsListWrapper from "./ListWrapper";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <PsychologistsListWrapper searchParams={searchParams} />;
}