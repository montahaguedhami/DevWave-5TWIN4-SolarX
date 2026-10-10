import { createContext, useState, useEffect } from "react";
import useSWR from "swr";
import { deleteFetcher, getFetcher, postFetcher } from "@/services/global-fetcher";
const TicketContext = createContext(
  {}
);
const TicketProvider = ({
  children
}) => {
  const [tickets, setTickets] = useState([]);
  const [ticketSearch, setTicketSearch] = useState("");
  const [filter, setFilter] = useState("total_tickets");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {
    data: ticketsData,
    isLoading: isTicketsLoading,
    error: ticketsError,
    mutate
  } = useSWR("/api/ticket", getFetcher, { revalidateOnMount: true });
  useEffect(() => {
    if (ticketsData) {
      setTickets(ticketsData.data);
      setLoading(isTicketsLoading);
    } else if (ticketsError) {
      setError(ticketsError);
      setLoading(isTicketsLoading);
    } else {
      setLoading(isTicketsLoading);
    }
  }, [ticketsData, ticketsError]);
  const deleteTicket = async (id) => {
    try {
      await mutate(deleteFetcher("/api/ticket", { id }));
    } catch (err) {
      console.error("Error deleting ticket:", err);
    }
  };
  const searchTickets = (searchTerm) => {
    setTicketSearch(searchTerm);
  };
  const addTicket = async (newTicket) => {
    try {
      await mutate(postFetcher("/api/ticket", newTicket));
    } catch (err) {
      console.error("Error adding ticket:", err);
    }
  };
  return <TicketContext.Provider
    value={{
      tickets,
      error,
      loading,
      deleteTicket,
      setTicketSearch,
      searchTickets,
      addTicket,
      ticketSearch,
      filter,
      setFilter
    }}
  >
      {children}
    </TicketContext.Provider>;
};
export {
  TicketContext,
  TicketProvider
};
