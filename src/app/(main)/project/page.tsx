import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

type Props = {};

const Page = (props: Props) => {
  return (
    <div className="p-4 text-center h-screen w-screen flex justify-center items-center flex-col">
      <h1 className="text-3xl md:text-2xl">
        No Projects have yet been created or you don&apos;t have access to any!
      </h1>
      <p>Please contact support or your agency owner to get access</p>
      <Link href="/" className="mt-4">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
};

export default Page;
