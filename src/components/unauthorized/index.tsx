import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";

type Props = {};

const Unauthorized = (props: Props) => {
  return (
    <div className="p-4 text-center h-screen w-screen flex justify-center items-center flex-col">
      <h1 className="text-3xl md:text-6xl">Unauthorized acccess!</h1>
      <p>Please contact support or your agency owner to get access</p>
      <Link href="/" className="mt-4">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
};

export default Unauthorized;
