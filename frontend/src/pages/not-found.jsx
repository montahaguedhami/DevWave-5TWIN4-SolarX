const Image = (props) => <img {...props} />;
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
const Error = () => {
  return <>
      <div className="h-screen flex items-center justify-center bg-card dark:bg-black">
        <div className="text-center">
          <Image
    src="/images/backgrounds/404.svg"
    alt="error"
    className="mb-20"
    width={500}
    height={500}
  />
          <h1 className="text-foreground text-4xl mb-6">Opps!!!</h1>
          <h6 className="text-xl text-foreground">
            This page you are looking for could not be found.
          </h6>
          <Button className="mt-6 mx-auto">
            <Link to="/">Go Back to Home</Link>
          </Button>
        </div>
      </div>
    </>;
};
var not_found_default = Error;
export {
  not_found_default as default
};
