
import { Faq3 } from "@/components/ui/faq3";

const demoData = {
  heading: "Grid2Play FAQs",
  description: "Everything you need to know about booking sports facilities with Grid2Play. Can't find what you're looking for? Our team is here to help.",
  items: [
    {
      id: "faq-1",
      question: "How far in advance can I book a slot?",
      answer: "You can book facilities up to 30 days in advance. Popular time slots fill up quickly, so we recommend booking early.",
    },
    {
      id: "faq-2",
      question: "Is there a mobile app for Grid2Play?",
      answer: "Yes! Our mobile app (available for iOS and Android) makes booking and managing your sports sessions even easier.",
    },
    {
      id: "faq-3",
      question: "What safety measures are in place?",
      answer: "All partner facilities meet our safety standards. Equipment is regularly sanitized and facilities are maintained to ensure safe play.",
    },
    {
      id: "faq-4",
      question: "Can I invite friends to join my booking?",
      answer: "Absolutely! When booking, you can add participants and share the booking details directly with them.",
    },
    {
      id: "faq-5",
      question: "Do you offer corporate or team packages?",
      answer: "Yes, we have special packages for corporate events, team practices, and tournaments. Contact our sales team for details.",
    },
  ],
  supportHeading: "Game on! We're here to help",
  supportDescription: "Whether you're setting up a casual game or organizing a tournament, our sports specialists can help with all your booking needs.",
  supportButtonText: "Chat with Support",
  supportButtonUrl: "/contact",
};

export default function Faq3Demo() {
  return <Faq3 {...demoData} />;
}
