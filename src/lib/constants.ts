import BarChart from "@/components/icons/bar_chart";
import Calendar from "@/components/icons/calendar";
import CheckCircle from "@/components/icons/check_circled";
import Chip from "@/components/icons/chip";
import ClipboardIcon from "@/components/icons/clipboardIcon";
import Compass from "@/components/icons/compass";
import Database from "@/components/icons/database";
import Flag from "@/components/icons/flag";
import Headphone from "@/components/icons/headphone";
import Home from "@/components/icons/home";
import Info from "@/components/icons/info";
import LinkIcon from "@/components/icons/link";
import Lock from "@/components/icons/lock";
import Message from "@/components/icons/messages";
import Notification from "@/components/icons/notification";
import Payment from "@/components/icons/payment";
import Person from "@/components/icons/person";
import Workflow from "@/components/icons/workflow";
import TrailTailorCategory from "@/components/icons/trailtailor-category";
import Power from "@/components/icons/power";
import Receipt from "@/components/icons/receipt";
import Send from "@/components/icons/send";
import Settings from "@/components/icons/settings";
import Shield from "@/components/icons/shield";
import Star from "@/components/icons/star";
import Tune from "@/components/icons/tune";
import Video from "@/components/icons/video_recorder";
import Wallet from "@/components/icons/wallet";
import Warning from "@/components/icons/warning";

export const pricingCards = [
  {
    title: "Starter",
    description: "Perfect for trying out TrailTailor",
    price: "Free",
    duration: "",
    highlight: "Key features",
    features: ["3 Projects", "3 Team members", "Unlimited workflow"],
    priceId: "",
  },
  {
    title: "Premium",
    description: "The ultimate agency kit",
    price: "$199",
    duration: "month",
    highlight: "Key features",
    features: ["Unlimited Project", "Unlimited Team members"],

    priceId: "price_1RG0PDEmUyEyTdquMWX67IPU",
  },
  {
    title: "Basic",
    description: "For serious agency owners",
    price: "$49",
    duration: "month",
    highlight: "Everything in Starter, plus",
    features: ["Rebilling", "24/7 Support team"],
    priceId: "price_1QpzonEmUyEyTdqul8Z3Ph4q",
  },
];

export const addOnProducts = [
  { title: "Priority Support", id: "prod_Rk9liwcyqQOOb0" },
];

export const icons = [
  {
    value: "chart",
    label: "Bar Chart",
    path: BarChart,
  },
  {
    value: "headphone",
    label: "Headphones",
    path: Headphone,
  },
  {
    value: "send",
    label: "Send",
    path: Send,
  },
  {
    value: "workflow",
    label: "Workflow",
    path: Workflow,
  },
  {
    value: "calendar",
    label: "Calendar",
    path: Calendar,
  },
  {
    value: "settings",
    label: "Settings",
    path: Settings,
  },
  {
    value: "check",
    label: "Check Circled",
    path: CheckCircle,
  },
  {
    value: "chip",
    label: "Chip",
    path: Chip,
  },
  {
    value: "compass",
    label: "Compass",
    path: Compass,
  },
  {
    value: "database",
    label: "Database",
    path: Database,
  },
  {
    value: "flag",
    label: "Flag",
    path: Flag,
  },
  {
    value: "home",
    label: "Home",
    path: Home,
  },
  {
    value: "info",
    label: "Info",
    path: Info,
  },
  {
    value: "link",
    label: "Link",
    path: LinkIcon,
  },
  {
    value: "lock",
    label: "Lock",
    path: Lock,
  },
  {
    value: "messages",
    label: "Messages",
    path: Message,
  },
  {
    value: "notification",
    label: "Notification",
    path: Notification,
  },
  {
    value: "payment",
    label: "Payment",
    path: Payment,
  },
  {
    value: "power",
    label: "Power",
    path: Power,
  },
  {
    value: "receipt",
    label: "Receipt",
    path: Receipt,
  },
  {
    value: "shield",
    label: "Shield",
    path: Shield,
  },
  {
    value: "star",
    label: "Star",
    path: Star,
  },
  {
    value: "tune",
    label: "Tune",
    path: Tune,
  },
  {
    value: "videorecorder",
    label: "Video Recorder",
    path: Video,
  },
  {
    value: "wallet",
    label: "Wallet",
    path: Wallet,
  },
  {
    value: "warning",
    label: "Warning",
    path: Warning,
  },
  {
    value: "person",
    label: "Person",
    path: Person,
  },
  {
    value: "category",
    label: "Category",
    path: TrailTailorCategory,
  },
  {
    value: "clipboardIcon",
    label: "Clipboard Icon",
    path: ClipboardIcon,
  },
];

export type EditorBtns =
  | "text"
  | "container"
  | "section"
  | "contactForm"
  | "paymentForm"
  | "link"
  | "2Col"
  | "video"
  | "__body"
  | "image"
  | null
  | "3Col";

export const defaultStyles: React.CSSProperties = {
  backgroundPosition: "center",
  objectFit: "cover",
  backgroundRepeat: "no-repeat",
  textAlign: "left",
  opacity: "100%",
};
