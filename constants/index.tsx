import { Ellipsis } from "lucide-react";
import { Fragment } from "react";
import {
    BreadcrumbItem,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

export const EllipsisBreadcrumb = () => (
  <Fragment>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>
        <Ellipsis size={15} />
      </BreadcrumbPage>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
  </Fragment>
);