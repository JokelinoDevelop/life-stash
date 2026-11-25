import { requiredText } from "@/lib/form-schemas";

/** The name row: the only typed preference (the rest are picked from lists). */
export const displayNameSchema = requiredText(60);
