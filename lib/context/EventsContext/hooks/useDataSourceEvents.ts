import { useContext } from "react";
import { DataSourceEventsContext } from "../index";

export const useDataSourceEvents = () => {
  const context = useContext(DataSourceEventsContext);

  if (!context) {
    throw new Error("useDataSourceEvents must be used within EventsProvider");
  }
  return context;
};
