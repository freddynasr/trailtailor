"use client";
import { Contact2Icon } from "lucide-react";
import ToolbarButton from "./ToolbarButton";

const ContactFormPlaceholder = () => (
  <ToolbarButton id="contactForm">
    <Contact2Icon size={40} className="text-muted-foreground" />
  </ToolbarButton>
);

export default ContactFormPlaceholder;
