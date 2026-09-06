import { Polar } from "@polar-sh/sdk";

export const POLAR_PRO_PRODUCT_ID =
  "231a4322-30b1-4c0f-b08f-0b409b64e258";

export const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: "sandbox",
});
