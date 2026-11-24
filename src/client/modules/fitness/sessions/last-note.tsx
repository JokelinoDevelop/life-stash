import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FormNotice } from "@/components/form/dialog-form";
import { useFormat } from "@/lib/format";

import { lastNoteQuery } from "../fitness.queries";

/** "Last time (19.11): Squats 5x5 @ 100" — the note from the last time this training was done. */
export const LastNote = ({
  before,
  trainingId,
}: {
  before: string;
  trainingId: string;
}) => {
  const { t } = useTranslation("fitness");
  const format = useFormat();
  const last = useQuery(lastNoteQuery(trainingId, before));
  const note = last.data?.previousNote;

  if (note === null || note === undefined) {
    return null;
  }

  return (
    <FormNotice icon={<History />}>
      <span className="font-medium">
        {t("sessions.lastTime", { date: format.shortDate(note.date) })}
      </span>{" "}
      <span className="whitespace-pre-line">{note.note}</span>
    </FormNotice>
  );
};
