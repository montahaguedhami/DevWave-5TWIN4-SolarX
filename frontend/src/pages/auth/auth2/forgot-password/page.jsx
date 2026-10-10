import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import FullLogo from "@/components/layout/shared/logo/full-logo";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
const metadata = {
  title: "Boxed Forgot Password Auth",
  description: "Reset your password by entering your email."
};
const BoxedForgotpwd = () => {
  return <>
        <div className="relative overflow-hidden h-screen bg-muted ">
        <div className="flex h-full justify-center items-center px-4">
          <Card className="md:w-112.5 w-full border-none shadow-lg  p-6">
            <div className="mx-auto  w-fit">
              <FullLogo />
            </div>
            <p className="text-sm font-normal text-muted-foreground">
              Please enter the email address associated with your account and
              we will email you a link to reset your password.
            </p>
            <form className="space-y-6 w-full">

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label
    htmlFor="email"
    className="text-sm font-normal text-muted-foreground"
  >
                    Email*
                  </Label>
                  <Input
    id="email"
    type="email"
    placeholder="example@shadcndashboard.com"
    required
  />
                </div>
              </div>

              <Button className="w-full rounded-lg">
                Forgot password
              </Button>
            </form>
            <Button className="w-full " variant={"outline"}>
              <Link to="/auth/auth2/login">Back to Login</Link>
            </Button>
          </Card>
        </div>
      </div>
    </>;
};
var page_default = BoxedForgotpwd;
export {
  page_default as default,
  metadata
};
