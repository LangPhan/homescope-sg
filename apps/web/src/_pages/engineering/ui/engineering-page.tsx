import { Footer } from "@/shared/ui";
import { EngineeringInfographic } from "./engineering-infographic";

export const metadata = {
  title: "Engineering case study",
  description:
    "An animated, end-to-end tour of the architecture, data, AI safety, observability and delivery behind HomeScope SG.",
};

export default function EngineeringPage() {
  return (
    <main>
      <EngineeringInfographic />
      <Footer />
    </main>
  );
}
