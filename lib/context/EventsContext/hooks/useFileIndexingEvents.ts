import { useContext } from "react";
import { FileIndexingEventsContext } from "../index";

export const useFileIndexingEvents = () => {
  const context = useContext(FileIndexingEventsContext);

  if (!context) {
    throw new Error("useFileIndexingEvents must be used within EventsProvider");
  }
  return context;
};
