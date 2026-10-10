import { useContext, useState, useEffect } from "react";
import { Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { NotesContext } from "@/context/notes-context/index";
const NoteContent = () => {
  const { notes, updateNote, selectedNoteId } = useContext(NotesContext);
  const noteDetails = notes.find((note) => note.id === selectedNoteId);
  const [initialTitle, setInitialTitle] = useState("");
  const [updatedTitle, setUpdatedTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  useEffect(() => {
    if (noteDetails) {
      setInitialTitle(noteDetails.title ?? "");
      setUpdatedTitle(noteDetails.title ?? "");
    }
  }, [noteDetails]);
  const handleTitleChange = (e) => {
    setUpdatedTitle(e.target.value);
    setIsEditing(true);
  };
  const handleColorChange = (color) => {
    const titleToUse = isEditing ? updatedTitle : initialTitle;
    updateNote(selectedNoteId, titleToUse, color);
  };
  const handleBlur = () => {
    setIsEditing(false);
    if (noteDetails && typeof noteDetails.color === "string") {
      updateNote(selectedNoteId, updatedTitle, noteDetails.color);
    }
  };
  const colorvariation = [
    { id: 1, lineColor: "chart-4", disp: "chart-4" },
    { id: 2, lineColor: "primary", disp: "primary" },
    { id: 3, lineColor: "destructive", disp: "destructive" },
    { id: 4, lineColor: "chart-2", disp: "chart-2" },
    { id: 5, lineColor: "chart-3", disp: "chart-3" }
  ];
  return <>
      <div className="flex flex-grow p-6">
        {
    /* ------------------------------------------- */
  }
        {
    /* Edit notes */
  }
        {
    /* ------------------------------------------- */
  }
        {noteDetails ? <div className="w-full">
            <Textarea
    id="outlined-multiline-static"
    placeholder="Edit Note"
    rows={5}
    value={isEditing ? updatedTitle : initialTitle}
    onChange={handleTitleChange}
    className="w-full p-6 "
    onBlur={handleBlur}
  />
            <br />
            <h6 className="text-base mb-3">Change Note Color</h6>

            <div className="flex gap-2 items-center">
              {colorvariation.map((color1) => <div
    className={`h-7 w-7 flex justify-center items-center rounded-full cursor-pointer  bg-${color1?.disp}`}
    key={color1.id}
    onClick={() => handleColorChange(color1.disp)}
  >
                  {noteDetails.color === color1.disp ? <Check width="18" className="text-foreground" /> : null}
                </div>)}
            </div>
          </div> : <div className="text-center w-full py-6 text-2xl ">Select a Note</div>}
      </div>
    </>;
};
var stdin_default = NoteContent;
export {
  stdin_default as default
};
