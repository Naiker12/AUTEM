import { createFileRoute } from "@tanstack/react-router";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { NosotrosPage } from "@/components/nosotros";
import { BotonWhatsappFlotante } from "@/components/pie-pagina";

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
    <div className="min-h-screen bg-[#f6f1eb] font-sans text-[#403a34] selection:bg-[#403a34] selection:text-[#f6f1eb]">
      <Navbar variant="about" />
      <main id="main-content">
        <NosotrosPage />
      </main>
      <Footer />
      <BotonWhatsappFlotante />
    </div>
  );
}
