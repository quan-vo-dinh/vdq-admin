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
import {
  siAntdesign,
  siReactquery,
  siNestjs,
  siSocketdotio,
  siRedis,
  siApachekafka,
  siKeycloak,
  siMongodb,
  type SimpleIcon,
} from "simple-icons";
type IconName = (typeof iconNames)[number];
// Ship the selected SVG paths with the app; never fetch brand logos at runtime.
function simple(icon: SimpleIcon) {
  return function BrandIcon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d={icon.path} />
      </svg>
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
  antdesign: simple(siAntdesign),
  reactquery: simple(siReactquery),
  nestjs: simple(siNestjs),
  socketdotio: simple(siSocketdotio),
  redis: simple(siRedis),
  apachekafka: simple(siApachekafka),
  keycloak: simple(siKeycloak),
  mongodb: simple(siMongodb),
};
