import Divider from "@/components/shared/divider";
const StyleDivider = ({ wrapperClassName }) => {
  if (wrapperClassName) {
    return <div className={wrapperClassName}>
        <Divider noContainer />
      </div>;
  }
  return <Divider noContainer />;
};
var StyleDivider_default = StyleDivider;
export {
  StyleDivider_default as default
};
