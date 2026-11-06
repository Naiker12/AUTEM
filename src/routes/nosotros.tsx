import { createFileRoute } from "@tanstack/react-router";
import SiteNavbar from "@/components/site/SiteNavbar";
import SiteFooter from "@/components/site/SiteFooter";
import AboutPage from "@/components/about/AboutPage";
import FloatingWhatsAppButton from "@/components/site/FloatingWhatsAppButton";

export const Route = createFileRoute("/nosotros")({
  component: Nosotros,
  head: () => ({
    links: [{ rel: "canonical", href: "https://autem.es/nosotros" }],
    meta: [
      { title: "Nosotros | AUTEM" },
      {
        name: "description",
        content: "Conoce la misión, visión, propósito, servicios y método de trabajo de AUTEM.",
      },
    ],
  }),
});

function Nosotros() {
  return (
    <div className="min-h-screen font-sans bg-[#f0ebe6] text-[#4f4742] selection:bg-[#4f4742]/15">
      <SiteNavbar variant="about" />
      <main id="main-content">
        <AboutPage />
      </main>
      <SiteFooter />
      <FloatingWhatsAppButton />
    </div>
  );
}
