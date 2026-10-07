import { createContext } from "react";

export const ModalPresentationContext = createContext<"modal" | "sheet">("modal");
export const ModalPresentationProvider = ModalPresentationContext.Provider;
