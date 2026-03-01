"use server";

import { getPsychologistsList } from "@/lib/actions/admin-psychologists";

export async function getPsychologists() {
    return await getPsychologistsList();
}