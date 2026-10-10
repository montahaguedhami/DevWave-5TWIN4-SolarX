import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FileUploadMotion from "@/components/animated-components/file-uploadmotion";
const Media = () => {
  return <>
      <Card>
        <CardHeader>
          <CardTitle>
            <h5>Cover Image</h5>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FileUploadMotion />
        </CardContent>
      </Card>
    </>;
};
var stdin_default = Media;
export {
  stdin_default as default
};
