export interface ChildItem {
  id?: number | string;
  name: string;
  icon?: LucideIcon;
  items?: ChildItem[];
  item?: unknown;
  url?: string;
  color?: string;
  disabled?: boolean;
  subtitle?: string;
  badge?: boolean;
  badgeType?: string;
  badgeContent?: string;
  isActive?: boolean;
  external?: boolean;
  isPro?: boolean
}

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: LucideIcon;
  id?: number;
  to?: string;
  item?: MenuItem[];
  items?: ChildItem[];
  url?: string;
  disabled?: boolean;
  subtitle?: string;
  badgeType?: string;
  badge?: boolean;
  badgeContent?: string;
  isActive?: boolean;
  isPro?: boolean
}

import { uniqueId } from "lodash";
import {
  BookOpen,
  Code2,
  CalendarRange,
  CircleUserRound,
  Lock,
  LogIn,
  LucideIcon,
  NotebookText,
  Wallet,
  ShieldCheck,
  Unlink,
  UserPlus,
} from "lucide-react";

const SidebarContent: MenuItem[] = [
  {
    heading: "Developer",
    items: [{ id: uniqueId(), name: "Developer Workspace", icon: Code2, items: [
      { id: uniqueId(), name: "Developer Overview", url: "/developer" },
      { id: uniqueId(), name: "AI Usage", url: "/developer/ai" },
      { id: uniqueId(), name: "Developer Feed", url: "/developer/feed" },
      { id: uniqueId(), name: "Connections", url: "/developer/connections" },
    ] }],
  },
  {
    heading: "Personal Finance",
    items: [
      {
        id: uniqueId(),
        name: "My Finances",
        icon: Wallet,
        items: [
          { id: uniqueId(), name: "Finance Overview", url: "/finance" },
          { id: uniqueId(), name: "Transactions", url: "/finance/transactions" },
          { id: uniqueId(), name: "Budgets", url: "/finance/budgets" },
          { id: uniqueId(), name: "Savings Goals", url: "/finance/goals" },
          { id: uniqueId(), name: "Cash Flow", url: "/finance/cash-flow" },
        ],
      },
    ],
  },
  {
    heading: "Pages",
    items: [
      {
        id: uniqueId(),
        name: "User Profile",
        icon: CircleUserRound,
        url: "/pages/user-profile",
      },
    ],
  },
  {
    heading: "Apps",
    items: [
      {
        id: uniqueId(),
        name: "Big Calendar",
        icon: CalendarRange,
        url: "/apps/calendar",
      },
      {
        id: uniqueId(),
        name: "Notes",
        icon: NotebookText,
        url: "/apps/notes",
      },
      {
        name: "Blogs",
        id: uniqueId(),
        icon: BookOpen,
        items: [
          {
            id: uniqueId(),
            name: "Blog Listing",
            url: "/apps/blog/post",
          },
          {
            id: uniqueId(),
            name: "Blog Detail",
            url: "/apps/blog/detail/streaming-video-way-before-it-was-cool-go-dark-tomorrow",
          },
          {
            id: uniqueId(),
            name: "Blog Edit",
            url: "/apps/blog/edit",
          },
          {
            id: uniqueId(),
            name: "Blog Create",
            url: "/apps/blog/create",
          },
          {
            id: uniqueId(),
            name: "Manage Blog",
            url: "/apps/blog/manage-blog",
          },
        ],
      },
      {
        id: uniqueId(),
        name: "Daily Learning",
        icon: BookOpen,
        url: "/apps/tickets",
      },
    ],
  },
  {
    heading: "Auth",
    items: [
      {
        id: uniqueId(),
        name: "Error",
        icon: Unlink,
        url: "/auth/error",
      },
      {
        name: "Login",
        id: uniqueId(),
        icon: LogIn,
        items: [
          {
            id: uniqueId(),
            name: "Boxed Login",
            url: "/auth/auth2/login",
          },
        ],
      },
      {
        name: "Register",
        id: uniqueId(),
        icon: UserPlus,
        items: [
          {
            id: uniqueId(),
            name: "Boxed Register",
            url: "/auth/auth2/register",
          },
        ],
      },
      {
        name: "Forgot Password",
        id: uniqueId(),
        icon: Lock,
        items: [
          {
            id: uniqueId(),
            name: "Boxed Forgot Pwd",
            url: "/auth/auth2/forgot-password",
          },
        ],
      },
      {
        name: "Two Steps",
        id: uniqueId(),
        icon: ShieldCheck,
        items: [
          {
            id: uniqueId(),
            name: "Boxed Two Steps",
            url: "/auth/auth2/two-steps",
          },
        ],
      }
    ],
  },

];

export default SidebarContent;
