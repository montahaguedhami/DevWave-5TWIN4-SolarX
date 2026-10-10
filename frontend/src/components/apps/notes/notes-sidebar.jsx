import Notelist from "./notes-list";
const NotesSidebar = () => {
  return <>
      <div className="w-80 border-e border-border p-6 h-full">
        <Notelist />
      </div>
    </>;
};
var stdin_default = NotesSidebar;
export {
  stdin_default as default
};
