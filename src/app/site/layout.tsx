import Navigation from "@/components/site/navigation";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <main className="h-full relative">
        <div
          className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 dark:[background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)]
        "></div>
        {/* <div class="absolute inset-0 -z-10 h-full w-full bg-white "></div> */}
        <Navigation />
        <div
          id="scrollable-layout"
          className="absolute inset-0 overflow-scroll">
          {children}
        </div>
      </main>
    </ClerkProvider>
  );
};

export default layout;
