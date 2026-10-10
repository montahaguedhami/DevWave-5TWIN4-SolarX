import { createContext, useState, useEffect } from "react";
import useSWR from "swr";
import { deleteFetcher, getFetcher, postFetcher, putFetcher } from "@/services/global-fetcher";
const initialContext = {
  notes: [],
  loading: true,
  error: null,
  selectedNoteId: 1,
  selectNote: (id) => {
  },
  addNote: async (newNote) => {
  },
  updateNote: async (id, title, color) => {
  },
  deleteNote: async (id) => {
  }
};
const NotesContext = createContext(initialContext);
const NotesProvider = ({
  children
}) => {
  const [notes, setNotes] = useState(initialContext.notes);
  const [loading, setLoading] = useState(initialContext.loading);
  const [error, setError] = useState(initialContext.error);
  const [selectedNoteId, setSelectedNoteId] = useState(
    initialContext.selectedNoteId
  );
  const {
    data: notesData,
    isLoading: isNotesLoading,
    error: notesError,
    mutate
  } = useSWR("/api/notes", getFetcher);
  useEffect(() => {
    if (notesData) {
      setNotes(notesData.data);
      setLoading(false);
    } else if (notesError) {
      setError(notesError);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [notesData, notesError]);
  const selectNote = (id) => {
    setSelectedNoteId(id);
  };
  const addNote = async (newNote) => {
    try {
      await mutate(postFetcher("/api/notes", newNote));
    } catch (error2) {
      console.error("Error adding note:", error2);
    }
  };
  const updateNote = async (id, title, color) => {
    try {
      await mutate(putFetcher("/api/notes", { id, title, color }));
    } catch (error2) {
      console.error("Error updating note:", error2);
    }
  };
  const deleteNote = async (id) => {
    try {
      const response = await mutate(deleteFetcher("/api/notes", { id }));
      console.log(response.data);
    } catch (error2) {
      console.error("Error deleting note:", error2);
    }
  };
  return <NotesContext.Provider
    value={{
      notes,
      loading,
      error,
      selectedNoteId,
      selectNote,
      addNote,
      updateNote,
      deleteNote
    }}
  >
      {children}
    </NotesContext.Provider>;
};
export {
  NotesContext,
  NotesProvider
};
