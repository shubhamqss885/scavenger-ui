import { useContext } from "react";
import { OrgDbStatusEventsContext } from "../index";

export const useOrgDbStatusEvents = () => {
  const context = useContext(OrgDbStatusEventsContext);

  if (!context) {
    throw new Error("useOrgDbStatusEvents must be used within EventsProvider");
  }
  return context;
};
