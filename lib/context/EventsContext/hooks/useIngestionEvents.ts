import { useContext } from "react";
import { IngestionEventsContext } from "../index";

export const useIngestionEvents = () => {
  const context = useContext(IngestionEventsContext);

  if (!context) {
    throw new Error("useIngestionEvents must be used within EventsProvider");
  }
  return context;
};
