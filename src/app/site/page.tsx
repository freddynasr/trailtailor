import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { pricingCards } from "@/lib/constants";
import { stripe } from "@/lib/stripe";
import clsx from "clsx";
import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const prices = await stripe.prices.list({
    product: process.env.NEXT_TRAILTAILOR_PRODUCT_ID,
    active: true,
  });

  return (
    <>
      <section className="h-full w-full md:pt-44 relative flex items-center justify-center flex-col lg:mt-20">
        {/* grid */}
        {/* 
        <div className="absolute bottom-0 left-0 right-0 -top-5 bg-[linear-gradient(to_right,#161616_1px,transparent_1px),linear-gradient(to_bottom,#161616_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] -z-10" /> */}

        <p className="text-center">Run your agency, in one place</p>
        <div className="bg-gradient-to-r from-primary to-secondary-foreground text-transparent bg-clip-text relative">
          <h1 className="text-7xl font-bold text-center md:text-[200px]">
            TrailTailor
          </h1>
        </div>
        <div className="flex justify-center items-center relative md:mt-[-60px]">
          <Image
            src={"/assets/preview.png"}
            alt="banner image"
            height={1200}
            width={1200}
            className="rounded-2xl border-2 border-muted"
          />
          <div className="bottom-0 top-[50%] bg-gradient-to-t dark:from-background left-0 right-0 absolute z-10"></div>
        </div>
      </section>
      <section className="flex justify-center items-center flex-col gap-4 mt-0 sm:mt-5 md:mt-10 lg:mt-44">
        <h2 className="text-4xl text-center"> Choose what fits you right</h2>
        <p className="text-muted-foreground text-center">
          Our straightforward pricing plans are tailored to meet your needs. If
          {" you're"} not <br />
          ready to commit you can get started for free.
        </p>
        <div className="flex  justify-center gap-4 flex-wrap my-6">
          <Card
            className={clsx(
              "w-[300px] flex flex-col justify-between hover:border-2 hover:border-primary focus:border-2 focus:border-primary transition-all "
            )}>
            <CardHeader>
              <CardTitle
                className={clsx({
                  "text-muted-foreground": true,
                })}>
                {pricingCards[0].title}
              </CardTitle>
              <CardDescription>{pricingCards[0].description}</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-4xl font-bold">$0</span>
              <span>/ month</span>
            </CardContent>
            <CardFooter className="flex flex-col  items-start gap-4 ">
              <div>
                {pricingCards
                  .find((c) => c.title === "Starter")
                  ?.features.map((feature) => (
                    <div key={feature} className="flex gap-2">
                      <Check />
                      <p>{feature}</p>
                    </div>
                  ))}
              </div>
              <Link href="/agency" className={clsx("w-full")}>
                <Button className="w-full bg-white hover:bg-primary text-primary hover:text-white border border-primary">
                  {" "}
                  Get Started
                </Button>
              </Link>
            </CardFooter>
          </Card>
          {prices.data.map((card) => (
            //WIP: Wire up free product from stripe
            <Card
              key={card.nickname}
              className={clsx(
                "w-[300px] flex flex-col justify-between hover:border-2 hover:border-primary transition-all "
              )}>
              <CardHeader>
                <CardTitle
                  className={clsx("", {
                    "text-muted-foreground": card.nickname !== "Premium",
                  })}>
                  {card.nickname}
                </CardTitle>
                <CardDescription>
                  {
                    pricingCards.find((c) => c.title === card.nickname)
                      ?.description
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-4xl font-bold">
                  {card.unit_amount && card.unit_amount / 100}
                </span>
                <span className="text-muted-foreground">
                  <span>/ {card.recurring?.interval}</span>
                </span>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-4">
                <div>
                  {pricingCards
                    .find((c) => c.title === card.nickname)
                    ?.features.map((feature) => (
                      <div key={feature} className="flex gap-2">
                        <Check />
                        <p>{feature}</p>
                      </div>
                    ))}
                </div>
                <Link
                  href={`/agency?plan=${card.id}`}
                  className={clsx("w-full")}>
                  <Button className="w-full bg-white hover:bg-primary text-primary hover:text-white border border-primary">
                    Get Started
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}

          {/* {pricingCards.map((card) => (
            <Card
              key={card.title}
              className={clsx("w-[300px] flex flex-col justify-between", {
                "border-2 border-primary": card.title === "Ultimate",
              })}>
              <CardHeader>
                <CardTitle
                  className={clsx("", {
                    "text-muted-foreground": card.title !== "Ultimate",
                  })}>
                  {card.title}
                </CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-4xl font-bold">{card.price}</span>
                <span className="text-muted-foreground">
                  <span>/ {card.duration}</span>
                </span>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-4">
                <div>
                  {card.features.map((feature) => (
                    <div key={feature} className="flex gap-2">
                      <Check />
                      <p>{feature}</p>
                    </div>
                  ))}
                </div>
                <Link href={`/agency?plan=${card.priceId}`} className="w-full">
                  <Button
                    className="w-full"
                    variant={
                      card.title !== "Ultimate" ? "secondary" : "default"
                    }>
                    Get Started
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))} */}
        </div>
      </section>
    </>
  );
}
