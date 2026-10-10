import { Trash2 } from "lucide-react";
import { useState, useContext, useEffect } from "react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { NotesContext } from "@/context/notes-context/index";
import AnimatedItem from "../../animated-components/list-animation";
import PlaceholdersInput from "@/components/animated-components/animatedinput-placeholder";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";
const Notelist = () => {
  const { notes, selectNote, deleteNote } = useContext(NotesContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeNoteId, setActiveNoteId] = useState(null);
  useEffect(() => {
    if (notes.length > 0) {
      const firstNoteId = notes[0].id;
      setActiveNoteId(firstNoteId);
    }
  }, [notes]);
  const filterNotes = (notes2, nSearch) => {
    if (nSearch !== "")
      return notes2.filter(
        (t) => !t.deleted && (t.title ?? "").toLocaleLowerCase().concat(" ").includes(nSearch.toLocaleLowerCase())
      );
    return notes2.filter((t) => !t.deleted);
  };
  const filteredNotes = filterNotes(notes, searchTerm);
  const handleNoteClick = (noteId) => {
    setActiveNoteId(noteId);
    selectNote(noteId);
  };
  const colorClasses = {
    primary: "bg-primary/5  text-primary border border-primary/20",
    destructive: "bg-destructive/5  text-primary border border-destructive/20",
    "chart-3": "bg-chart-3/5  text-primary  border border-chart-3/20",
    "chart-4": "bg-chart-4/5 text-primary border border-chart-4/20",
    "chart-2": "bg-chart-2/5 text-primary  border border-chart-2/20",
    secondary: "bg-secondary/5 text-primary  border border-secondary/20"
  };
  return <>
      <div className="overflow-hidden">
        <div className="relative w-full">

          <SearchIcon size={16} className="absolute left-2 top-1/2 -translate-y-1/2  text-muted-foreground" />

          <PlaceholdersInput
    value={searchTerm}
    className="pl-8!"
    onChange={setSearchTerm}
    placeholders={[
      "Search Notes...",
      "Find Your Notes...",
      "Look up Notes..."
    ]}
  />
        </div>
        <h6 className="text-base mt-6">All Notes</h6>
        <div className="flex flex-col gap-3 mt-4">
          {filteredNotes && filteredNotes.length ? filteredNotes.map((note, index) => <div key={note.id}>
                <AnimatedItem index={index}>
                  <div
    className={`cursor-pointer relative p-4 rounded-xl   ${colorClasses[note.color] || "bg-chart-5/5"} 
                  ${activeNoteId === note.id ? "scale-100" : "scale-95"} transition-transform duration-200`}
    onClick={() => handleNoteClick(note.id)}
  >
                    <h6 className={`text-base truncate text-primary`}>
                      {note.title}
                    </h6>
                    <div className="flex items-center justify-between">
                      <p className="text-xs">
                        {new Date(note.datef ?? "").toLocaleDateString()}
                      </p>
                      <div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Button
    variant={"ghost"}
    className={"hover:text-destructive hover:bg-destructive/12 text-black dark:text-foreground dark:hover:text-destructive dark:hover:bg-destructive/12"}
    size="icon"
    onClick={() => deleteNote(note.id)}
    aria-label="Delete note"
  >
                                <Trash2 size={18} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </AnimatedItem>
              </div>) : <Alert variant="destructive">
              <AlertTitle>No Notes Found!</AlertTitle>
            </Alert>}
        </div>
      </div>
    </>;
};
var stdin_default = Notelist;
export {
  stdin_default as default
};
