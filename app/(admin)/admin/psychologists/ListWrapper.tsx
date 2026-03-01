                                                  
import { getPsychologistsList } from "@/lib/actions/admin-psychologists";
import PsychologistsListPage from "./PsychologistsListPage";

export default async function PsychologistsListWrapper({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const list = await getPsychologistsList();

  return (
   <div>
     <PsychologistsListPage
      initialList={list}
      searchParams={params}
    />
   </div>
   
  );
}