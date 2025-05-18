"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { User } from "@clerk/nextjs/server";
import { ModeToggle } from "@/components/global/mode-toggle";

type Props = {
  user?: null | User;
};

export default function Navigation({ user }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // fall back to window if the element isn't found (e.g. Storybook)
    const container: HTMLElement | Window =
      document.getElementById("scrollable-layout") ?? window;

    const handleScroll = () => {
      const y =
        container === window
          ? (container as Window).scrollY
          : (container as HTMLElement).scrollTop;

      setScrolled(y > 200);
    };

    container.addEventListener("scroll", handleScroll);
    // run once on mount so the colour is correct if the page loads mid-scroll
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={clsx(
        "fixed top-0 right-0 left-0 p-4 flex items-center justify-between z-20 transition-colors",
        scrolled ? "bg-background/50" : "bg-transparent"
      )}>
      <aside className="flex items-center gap-2">
        <Image
          src={"./assets/trailtailor-logo.svg"}
          width={60}
          height={60}
          alt="TrailTailor logo"
        />
        <span className="text-xl font-bold">TrailTailor</span>
      </aside>

      {/* Center navigation links (optional for md screens) */}
      <nav className="hidden md:block absolute left-[50%] top-[50%] transform -translate-x-[50%] -translate-y-[50%]">
        {/* <ul className="flex items-center justify-center gap-8">
          <Link href={"#"}>Pricing</Link>
          <Link href={"#"}>About</Link>
          <Link href={"#"}>Documentation</Link>
          <Link href={"#"}>Features</Link>
        </ul> */}
      </nav>

      <aside className="flex gap-2 items-center">
        {!user && (
          <Link href={"/agency"}>
            <Button>Get Started</Button>
          </Link>
        )}
        <UserButton afterSignOutUrl="/" />
        <ModeToggle />
      </aside>
    </div>
  );
}
