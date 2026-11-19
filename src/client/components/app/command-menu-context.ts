import { createContext, useContext } from "react";

export interface CommandMenuControls {
  open: () => void;
}

export const CommandMenuContext = createContext<CommandMenuControls>({
  open: () => {
    // Outside the provider there is no menu to open.
  },
});

/** Opens the ⌘K command menu from anywhere (search buttons, mobile nav). */
export const useCommandMenu = (): CommandMenuControls =>
  useContext(CommandMenuContext);
