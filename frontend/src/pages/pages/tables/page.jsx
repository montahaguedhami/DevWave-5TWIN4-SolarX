import BreadcrumbComp from "../../layout/shared/breadcrumb/breadcrumb-comp";
import StyleAwareWrapper from "@/components/shared/StyleAwareWrapper";
import StyleDivider from "@/components/shared/StyleDivider";
import BasicTable from "@/components/tables/basic-table/BasicTable";
import DataTable from "@/components/tables/data-table/DataTable";
import { EmployeeData } from "@/components/tables/table-data";
import HoverTable from "@/components/tables/hover-table/HoverTable";
import StripedRowTable from "@/components/tables/striped-row-table/StripedRowTable";
import CheckboxTable from "@/components/tables/checkbox-table/CheckboxTable";
const metadata = {
  title: "Tables List"
};
const BCrumb = [
  {
    to: "/",
    title: "Home"
  },
  {
    title: "Tables List"
  }
];
function page() {
  return <StyleAwareWrapper
    lyraClassName="flex flex-col p-px gap-px bg-border"
  >
      <BreadcrumbComp title="Tables" items={BCrumb} />
      <StyleDivider />

      <StyleAwareWrapper
    lyraClassName="grid grid-cols-12 gap-px bg-border"
  >
        <div className="col-span-12">
          <BasicTable />
        </div>
        <div className="col-span-12">
          <StyleDivider />
        </div>
        <div className="col-span-12">
          <DataTable data={EmployeeData} />
        </div>
        <div className="col-span-12">
          <StyleDivider />
        </div>
        <div className="col-span-12">
          <HoverTable />
        </div>
        <div className="col-span-12">
          <StyleDivider />
        </div>
        <div className="col-span-12">
          <StripedRowTable />
        </div>
        <div className="col-span-12">
          <StyleDivider />
        </div>
        <div className="col-span-12">
          <CheckboxTable />
        </div>
        <div className="col-span-12">
          <StyleDivider />
        </div>
      </StyleAwareWrapper>

    </StyleAwareWrapper>;
}
var page_default = page;
export {
  page_default as default,
  metadata
};
