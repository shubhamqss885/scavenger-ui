import { useContext } from "react";
import { PaymentEventsContext } from "../index";

export const usePaymentEvents = () => {
  const context = useContext(PaymentEventsContext);

  if (!context) {
    throw new Error("usePaymentEvents must be used within EventsProvider");
  }
  return context;
};
