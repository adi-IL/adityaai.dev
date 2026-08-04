import { m } from 'motion/react';
import SEO from '../components/SEO';
import { SiUdemy, SiOpenai, SiGooglecloud } from 'react-icons/si';
import { ArrowUpRight, Award } from 'lucide-react';

const OracleIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M4 0C1.79 0 0 1.79 0 4V20C0 22.21 1.79 24 4 24H20C22.21 24 24 22.21 24 20V4C24 1.79 22.21 0 20 0H4ZM15.5 7.5H8.5C6.01 7.5 4 9.51 4 12C4 14.49 6.01 16.5 8.5 16.5H15.5C17.99 16.5 20 14.49 20 12C20 9.51 17.99 7.5 15.5 7.5ZM8.5 10H15.5C16.6 10 17.5 10.9 17.5 12C17.5 13.1 16.6 14 15.5 14H8.5C7.4 14 6.5 13.1 6.5 12C6.5 10.9 7.4 10 8.5 10Z"/>
  </svg>
);

const oracleCertifications = [
  {
    title: "AI Vector Search Professional",
    url: "https://catalog-education.oracle.com/ords/certview/sharebadge?id=5E4FDD09770E6D237020A75DD7D9024DDDF4142098FA1641EAAB2CB8D2B2B69F"
  },
  {
    title: "Cloud Infrastructure Associate",
    url: "https://catalog-education.oracle.com/ords/certview/sharebadge?id=303E588DC05D0D742ED0260BD00EFB0396791BC84690D91BF007C884D8F85FED"
  },
  {
    title: "Data Platform Associate",
    url: "https://catalog-education.oracle.com/ords/certview/sharebadge?id=1A6F1D38013F675295039B1C4A4A2209D6F1E280BD6D04B3E42112B8200F19F0"
  },
  {
    title: "Data Science Professional",
    url: "https://catalog-education.oracle.com/ords/certview/sharebadge?id=1A6F1D38013F675295039B1C4A4A22090C00355209CE06886B95D7DF8D8D08CB"
  }
];

const otherCertifications = [
  {
    title: "Google Cloud Certifications",
    issuer: "Google Cloud",
    icon: SiGooglecloud,
    url: "https://www.credly.com/users/aditya-gaurav.12219822/badges#credly"
  },
  {
    title: "OpenAI GenAI Certified",
    issuer: "OpenAI / NxtWave",
    icon: SiOpenai,
    url: "https://openai-buildathon.nxtwave.tech/certificate?cid=0VTIX2094G"
  },
  {
    title: "UI UX mastery certificate",
    issuer: "Udemy",
    icon: SiUdemy,
    url: "https://www.udemy.com/certificate/UC-475e9e06-bb3b-4c97-812a-24846c95c368/"
  }
];

export default function About() {
  return (
    <div className="min-h-screen pt-32 pb-16">
      <SEO
        title="About | Aditya Gaurav - AI Engineer & Systems Architect"
        description="AI Engineer & Systems Architect building cognitive architectures, agentic workflows, and the MCP ecosystem. Kaggle winner, Oracle certified, research archive on AI systems."
        canonicalUrl="https://www.adityaai.dev/about"
        ogType="profile"
        breadcrumbs={[
          { name: 'Home', url: 'https://www.adityaai.dev/' },
          { name: 'About', url: 'https://www.adityaai.dev/about' },
        ]}
      />
      
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-20">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          className="mb-16 border-b border-zinc-800/50 pb-16"
        >
          <h1 className="font-display font-semibold text-[clamp(2.5rem,8vw,4rem)] leading-[1.1] tracking-[-0.02em] text-zinc-50 mb-8">
            About
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <p className="text-zinc-400 text-lg leading-relaxed mb-6">
                I am an AI Researcher & Systems Architect focused on cognitive architectures and scalable intelligence. My work bridges the gap between theoretical AI models and production-ready systems.
              </p>
              <p className="text-zinc-400 text-lg leading-relaxed">
                With a deep focus on agentic workflows, large language models, and scalable inference, I build systems that don't just predict the next token, but actively plan, reason, and execute complex tasks.
              </p>
            </div>
            <div className="flex justify-center md:justify-end items-center">
              <img
                src="https://res.cloudinary.com/dpdttqyow/image/upload/f_auto,q_auto,w_500/v1768512786/Screenshot_2026-01-198_v3bwry.png"
                alt="Aditya Gaurav"
                className="w-auto h-auto max-w-[280px] object-contain opacity-90 hover:opacity-100 transition-opacity duration-500"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                width={500}
                height={500}
              />
            </div>
          </div>
        </m.div>
      </section>

      {/* Certifications Section */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 pb-32 cv-auto">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="flex items-center gap-3 mb-12">
            <Award className="text-electric-lime" size={28} />
            <h2 className="font-display font-semibold text-[clamp(1.75rem,4vw,2.5rem)] text-zinc-50">
              Certifications & Badges
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Oracle Certifications Bento Box */}
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-8 md:p-10 relative overflow-hidden group hover:border-zinc-700 transition-colors">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <OracleIcon size={180} className="text-zinc-500" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                    <div className="size-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <OracleIcon className="text-red-500" size={24} />
                  </div>
                  <h3 className="font-display text-2xl text-zinc-100">Oracle Certified</h3>
                </div>

                <div className="flex flex-col gap-4">
                  {oracleCertifications.map((cert) => (
                    <a 
                      key={cert.url}
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800/50 hover:border-electric-lime/50 hover:bg-zinc-900 transition-all group/item"
                    >
                      <span className="text-zinc-300 font-medium group-hover/item:text-electric-lime transition-colors">
                        {cert.title}
                      </span>
                      <ArrowUpRight size={16} className="text-zinc-600 group-hover/item:text-electric-lime transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Other Certifications Grid */}
            <div className="grid grid-rows-3 gap-4">
              {otherCertifications.map((cert) => (
                <a
                  key={cert.url}
                  href={cert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 md:p-8 flex items-center justify-between group hover:border-zinc-700 transition-colors relative overflow-hidden"
                >
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 group-hover:-rotate-12 duration-500">
                    <cert.icon size={120} className="text-zinc-500" />
                  </div>
                  
                  <div className="relative z-10 flex items-center gap-6">
                    <div className="size-12 rounded-xl bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50 group-hover:border-electric-lime/30 transition-colors">
                      <cert.icon className="text-zinc-400 group-hover:text-electric-lime transition-colors" size={24} />
                    </div>
                    <div>
                      <h3 className="font-display text-xl text-zinc-100 mb-1 group-hover:text-white transition-colors">{cert.title}</h3>
                      <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest">{cert.issuer}</p>
                    </div>
                  </div>
                  
                  <div className="relative z-10 size-10 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800 group-hover:border-electric-lime group-hover:bg-electric-lime/10 transition-all">
                    <ArrowUpRight size={18} className="text-zinc-500 group-hover:text-electric-lime transition-colors" />
                  </div>
                </a>
              ))}
            </div>

          </div>
        </m.div>
      </section>
    </div>
  );
}
