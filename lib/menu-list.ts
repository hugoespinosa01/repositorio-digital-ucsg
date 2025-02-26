import {
  Users,
  Settings,
  SquarePen,
  LayoutGrid,
  Package,
  FileDigit,
  List,
  File,
  User,
  FileUp,
  Files,
  Info
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
      groupLabel: "",
      menus: [
        {
          href: "/documents?page=1",
          label: "Ver documentos",
          active: pathname.includes("/documents"),
          icon: Files,
          submenus: []
        },
        {
          href: "/upload",
          label: "Subir documentos",
          active: pathname.includes("/upload"),
          icon: FileUp,
          submenus: []
        }
      ]
    },
    {
      groupLabel: "Ajustes",
      menus: [
        {
          href: "/account",
          label: "Cuenta",
          active: pathname.includes("/account"),
          icon: User,
          submenus: []
        },
        {
          href: "/info",
          label: "Información del sistema",
          active: pathname.includes("/info"),
          icon: Info,
          submenus: []
        }
      ]
    }
  ];
}
