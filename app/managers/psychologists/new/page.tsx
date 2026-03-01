"use client";

import NewPsychologistForm from "@/components/psychologist/NewPsychologistForm"
import { getDataListItems } from "@/lib/actions/manager-references";                            

export default function NewPsychologistPage() {
  return <NewPsychologistForm getDataListItems={getDataListItems} />;
}