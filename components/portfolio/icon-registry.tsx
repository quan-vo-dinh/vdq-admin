import { Typescript } from "./ui/svgs/typescript";
import { ReactLight } from "./ui/svgs/reactLight";
import { NextjsIconDark } from "./ui/svgs/nextjsIconDark";
import { Postgresql } from "./ui/svgs/postgresql";
import { Docker } from "./ui/svgs/docker";
import {
  HomeIcon,
  CameraIcon,
  FolderKanbanIcon,
  BookOpenIcon,
} from "lucide-react";
import { Icons } from "./icons";
import type { ComponentType, SVGProps } from "react";
import type { iconNames } from "@/lib/portfolio/model";
type IconName = (typeof iconNames)[number];
function simple(slug: string) {
  return function SimpleIcon({ className }: { className?: string }) {
    return (
      <img
        src={`https://cdn.simpleicons.org/${slug}`}
        alt=""
        className={className}
      />
    );
  };
}
export const iconRegistry: Record<
  IconName,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  Typescript,
  ReactLight,
  NextjsIconDark,
  Postgresql,
  Docker,
  HomeIcon,
  CameraIcon,
  FolderKanbanIcon,
  BookOpenIcon,
  "Icons.tailwindcss": Icons.tailwindcss,
  "Icons.github": Icons.github,
  "Icons.linkedin": Icons.linkedin,
  "Icons.facebook": Icons.facebook,
  "Icons.instagram": Icons.instagram,
  "Icons.x": Icons.x,
  "Icons.youtube": Icons.youtube,
  "Icons.email": Icons.email,
  antdesign: simple("antdesign"),
  reactquery: simple("reactquery"),
  nestjs: simple("nestjs"),
  socketdotio: simple("socketdotio"),
  redis: simple("redis"),
  apachekafka: simple("apachekafka"),
  keycloak: simple("keycloak"),
  mongodb: simple("mongodb"),
};
