import {
  Users,
  Settings,
  SquarePen,
  LayoutGrid,
  Package,
  FileDigit,
  List,
  File,
  User
} from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  active: boolean;
};

type Menu = {
  href: string;
  label: string;
  active: boolean;
  icon: any;
  submenus: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(pathname: string): Group[] {
  return [
    {
      groupLabel: "Documentos",
      menus: [
        {
          href: "/documents?page=1",
          label: "Ver documentos",
          active: pathname.includes("/documents"),
          icon: List,
          submenus: []
        },
        {
          href: "/upload",
          label: "Subir documentos",
          active: pathname.includes("/upload"),
          icon: File,
          submenus: []
        }
      ]
    },
    {
      groupLabel: "Configuración",
      menus: [
        {
          href: "/account",
          label: "Cuenta",
          active: pathname.includes("/account"),
          icon: User,
          submenus: []
        }
      ]
    }
  ];
}
