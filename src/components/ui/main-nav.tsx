// components/main-nav.tsx
"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { ThemeToggle } from "@/components/theme-toggle"; // Import ThemeToggle

export function MainNav() {
  return (
    <div className="border-b bg-background">
      <div className="flex h-16 items-center px-4 max-w-7xl mx-auto">
        <NavigationMenu className="flex-1">
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Home
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/library" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Library
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            {/* You can add more menu items here */}
          </NavigationMenuList>
        </NavigationMenu>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}