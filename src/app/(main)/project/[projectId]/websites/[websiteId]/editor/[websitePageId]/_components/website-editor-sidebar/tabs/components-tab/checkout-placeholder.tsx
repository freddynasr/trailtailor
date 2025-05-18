"use client";
import Image from "next/image";
import ToolbarButton from "./ToolbarButton";

const CheckoutPlaceholder = () => (
  <ToolbarButton id="paymentForm">
    <Image
      src="/stripelogo.png"
      width={40}
      height={40}
      alt="Stripe Logo"
      className="object-cover"
    />
  </ToolbarButton>
);

export default CheckoutPlaceholder;
