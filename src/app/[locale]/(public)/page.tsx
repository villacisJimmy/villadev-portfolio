import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/Hero/Hero";
import { Services } from "@/components/Services/Services";
import { About } from "@/components/About/About";
import { ProjectsSection } from "@/components/Projects/ProjectsSection";
import { Experience } from "@/components/Experience/Experience";
import { Certifications } from "@/components/Certifications/Certifications";
import { Skills } from "@/components/Skills/Skills";
// import { Contact } from "@/components/Contact/Contact";  // TODO: enable when Phase F creates it

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Hero />
      <Services />
      <About />
      <ProjectsSection />
      <Experience />
      <Certifications />
      <Skills />
      {/* <Contact /> */}
    </>
  );
}
