import { Card } from "@/components/ui/card";
const CardBox = ({ children, className }) => {
  return <Card
    className={`card no-inset no-ring ${className} shadow-none border border-border`}
    style={{ borderRadius: "12px" }}
  >
      {children}
    </Card>;
};
var CardBox_default = CardBox;
export {
  CardBox_default as default
};
