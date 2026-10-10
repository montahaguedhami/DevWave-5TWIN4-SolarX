import UserProfile from "@/components/user-profile";
const metadata = {
  title: "user-profile"
};
const Notes = () => {
  return <>
        <UserProfile />
    </>;
};
var page_default = Notes;
export {
  page_default as default,
  metadata
};
