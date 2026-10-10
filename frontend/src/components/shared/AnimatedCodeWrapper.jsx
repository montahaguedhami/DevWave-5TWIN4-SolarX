import { useState } from "react";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import SimpleBar from "simplebar-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Check, Copy, RotateCcw } from "lucide-react";
const AnimatedCodeWrapper = ({
  children,
  css = "",
  showReplayButton = false,
  onReplay
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState("tsx");
  const handleCopy = () => {
    const code = tab === "tsx" ? children : css;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3e3);
    });
  };
  return <div
    className="px-6 py-2 bg-muted dark:bg-card/20 border-t border-border "
    style={{ borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px" }}
  >
      {
    /* Top controls */
  }
      <div
    className={`flex items-center ${showReplayButton ? "justify-between" : "justify-end"}`}
  >
        {
    /* Replay button */
  }
        {showReplayButton && <button
    onClick={onReplay}
    className="text-xs py-1 px-2 rounded-lg border border-border dark:border-border hover:border-primary/12  hover:bg-primary/5  flex items-center gap-1"
  >
            <RotateCcw size={14} />
            Replay Animation
          </button>}

        <TooltipProvider>
          <div className="flex items-center gap-2">
            {
    /* Show / Hide */
  }
            <button
    onClick={() => setIsOpen(!isOpen)}
    className="text-xs py-1 px-1.5 rounded-lg border border-border dark:border-border hover:border-primary/12 hover:bg-primary/5 "
  >
              {isOpen ? "Hide Code" : "Show Code"}
            </button>

            {
    /* Copy */
  }
            <Tooltip>
              <TooltipTrigger>
                <button onClick={handleCopy} className="p-2">
                  {copied ? <Check
    size={20}
    className="text-primary"
  /> : <Copy
    size={20}
    className="hover:text-primary"
  />}
                </button>
              </TooltipTrigger>
              <TooltipContent className="whitespace-nowrap">
                Copy Code
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {
    /* Code Wrapper */
  }
      <div
    className={`code-modal rounded-md rounded-t-none p-0 my-3 bg-muted dark:bg-transparent overflow-hidden ${isOpen ? "block" : "hidden"}`}
  >
        <Tabs defaultValue="tsx" onValueChange={setTab}>
          {
    /* Header */
  }
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-base font-semibold dark:text-foreground">
              Component Code
            </h5>

            {
    /* Tabs header */
  }
            <TabsList className="px-3 pt-2">
              <TabsTrigger
    value="tsx"
    className="rounded-lg text-xs px-3 py-1.5"
  >
                TSX
              </TabsTrigger>

              {css && <TabsTrigger
    value="css"
    className="rounded-lg text-xs px-3 py-1.5"
  >
                  CSS
                </TabsTrigger>}
            </TabsList>
          </div>

          {
    /* TSX TAB */
  }
          <TabsContent value="tsx">
            <SimpleBar className="max-h-[400px]">
              <SyntaxHighlighter language="tsx" style={vscDarkPlus}>
                {children}
              </SyntaxHighlighter>
            </SimpleBar>
          </TabsContent>

          {
    /* CSS TAB */
  }
          <TabsContent value="css">
            <SimpleBar className="max-h-[400px]">
              <SyntaxHighlighter language="css" style={vscDarkPlus}>
                {css}
              </SyntaxHighlighter>
            </SimpleBar>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
};
var AnimatedCodeWrapper_default = AnimatedCodeWrapper;
export {
  AnimatedCodeWrapper_default as default
};
