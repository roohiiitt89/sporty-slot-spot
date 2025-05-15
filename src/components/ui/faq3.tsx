import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface Faq3Props {
  heading?: string;
  description?: string;
  items?: FaqItem[];
  supportHeading?: string;
  supportDescription?: string;
  supportButtonText?: string;
  supportButtonUrl?: string;
}

const defaultFaqItems: FaqItem[] = [
  {
    id: "faq-1",
    question: "How do I book a sports slot on Grid2Play?",
    answer: "Simply create an account, browse available facilities, select your preferred time slot, and complete the payment.",
  },
  {
    id: "faq-2",
    question: "What sports facilities can I book?",
    answer: "Football pitches, basketball courts, tennis courts, badminton courts, and swimming pools.",
  },
  {
    id: "faq-3",
    question: "Can I cancel or reschedule my booking?",
    answer: "Yes, you can cancel or reschedule up to 24 hours before your booking time.",
  },
  {
    id: "faq-4",
    question: "What payment methods do you accept?",
    answer: "All major credit/debit cards, digital wallets, and bank transfers.",
  },
  {
    id: "faq-5",
    question: "Do you offer group bookings?",
    answer: "Yes! We support group bookings with discounts for bulk reservations.",
  },
];

export const Faq3 = ({
  heading = "Grid2Play FAQs",
  description = "Find answers to common questions about booking sports facilities.",
  items = defaultFaqItems,
  supportHeading = "Need more assistance?",
  supportDescription = "Our sports booking experts are ready to help you.",
  supportButtonText = "Contact Support",
  supportButtonUrl = "/contact",
}: Faq3Props) => {
  return (
    <section className="py-16 md:py-24">
      <div className="container space-y-12">
        <div className="mx-auto flex max-w-3xl flex-col text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">{heading}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <Accordion type="single" collapsible className="mx-auto max-w-3xl">
          {items.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-medium">{item.question}</span>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">{item.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mx-auto max-w-3xl rounded-xl bg-secondary p-6 text-center">
          <div className="flex justify-center gap-2 mb-6">
            <Avatar className="border">
              <AvatarImage src="/images/support-football.webp" />
              <AvatarFallback>FB</AvatarFallback>
            </Avatar>
            <Avatar className="border">
              <AvatarImage src="/images/support-tennis.webp" />
              <AvatarFallback>TN</AvatarFallback>
            </Avatar>
          </div>
          <h3 className="mb-2 text-xl font-semibold">{supportHeading}</h3>
          <p className="mb-6 text-muted-foreground">{supportDescription}</p>
          <Button asChild>
            <a href={supportButtonUrl}>{supportButtonText}</a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Faq3;

