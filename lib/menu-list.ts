import {
  Users,
  Settings,
  SquarePen,
  LayoutGrid,
  Package,
  FileDigit,
  List,
  File
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
          href: "/documents",
          label: "Ver documentos",
          active: pathname.includes("/documents"),
          icon: List,
          submenus: []
        },
        {
          href: "/subirDocumento",
          label: "Subir documentos",
          active: pathname.includes("/subirDocumento"),
          icon: File,
          submenus: []
        }
      ]
    },
    {
      groupLabel: "Configuración",
      menus: [
        {
          href: "/users",
          label: "Usuarios",
          active: pathname.includes("/users"),
          icon: Users,
          submenus: []
        }
      ]
    }
  ];
}
