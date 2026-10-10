import { Link } from "react-router-dom";
const searchSugg = [
  { title: "Support", href: "https://shadcndashboard.dev/support" },
  { title: "License", href: "https://shadcndashboard.dev/license" }
];
function Footer() {
  return <div className="flex md:flex-row flex-col items-center justify-between gap-3 text-center">
            <p className="text-sm text-muted-foreground">
                © 2026 by{" "}
                <Link
    to="https://shadcndashboard.dev/"
    target="_blank"
    className="hover:text-primary text-muted-foreground"
  >
                    shadcndashboard
                </Link>
                , creating a better web for you.
            </p>

            <div className="flex gap-4">
                {searchSugg.map((item, index) => <Link
    key={index}
    target="_blank"
    to={item.href}
    className="text-sm hover:text-primary text-muted-foreground"
  >
                        {item.title}
                    </Link>)}
            </div>
        </div>;
}
export {
  Footer as default
};
