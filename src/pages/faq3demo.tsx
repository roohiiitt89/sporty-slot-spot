import { Faq3 } from "@/components/ui/faq3";

const demoData = {
  heading: "Grid2Play Help Center",
  description: "Everything you need to know about booking sports facilities with Grid2Play.",
  items: [
    {
      id: "faq-1",
      question: "How far in advance can I book?",
      answer: "You can book facilities up to 30 days in advance."
    },
    {
      id: "faq-2",
      question: "Is there a mobile app?",
      answer: "Yes! Our mobile app is available for iOS and Android."
    },
    {
      id: "faq-3",
      question: "What safety measures are in place?",
      answer: "All facilities meet our safety standards with regular maintenance."
    }
  ],
  supportHeading: "Still need help?",
  supportDescription: "Contact our support team for personalized assistance.",
  supportButtonText: "Get Help",
  supportButtonUrl: "/contact"
};

export default function Faq3Demo() {
  return <Faq3 {...demoData} />;
}
