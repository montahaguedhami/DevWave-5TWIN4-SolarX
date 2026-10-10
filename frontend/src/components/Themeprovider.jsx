import { ThemeProvider as NextThemesProvider } from "next-themes";
function ThemeProvider({
  children,
  ...props
}) {
  return <NextThemesProvider
    attribute="class"
    defaultTheme="light"
    enableSystem={false}
    disableTransitionOnChange
    {...props}
  >
    {children}
  </NextThemesProvider>;
}
export {
  ThemeProvider
};
