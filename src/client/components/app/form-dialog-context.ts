import { createContext, useContext } from "react";

export interface FormDialogControls {
  /** Close, asking first when the form has unsaved changes. */
  requestClose: () => void;
  /** Leave the form some other way (e.g. a link), asking first when it has unsaved changes. */
  requestLeave: (leave: () => void) => void;
  /** The form reports whether it has unsaved changes. */
  setDirty: (dirty: boolean) => void;
}

export const FormDialogContext = createContext<FormDialogControls | null>(null);

/** The surrounding `FormDialog`, or null when the form is used elsewhere. */
export const useFormDialog = () => useContext(FormDialogContext);
