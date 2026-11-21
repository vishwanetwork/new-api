import Anthropic from "@lobehub/icons/es/Anthropic/components/Mono";
import Gemini from "@lobehub/icons/es/Gemini/components/Color";
import OpenAI from "@lobehub/icons/es/OpenAI/components/Mono";
import { ArrowRight, ChevronDown, CreditCard, KeyRound, Wallet } from "lucide-react";
import { useState } from "react";
import { Brand } from "./Brand";
import { LandingProduct } from "./LandingProduct";
import { providerPopularityRank } from "./model-order";
import {
  TokenFactoryHeader,
  TokenFactoryHero,
  TokenFactoryBalance,
  scrollToSection,
} from "./token-factory";
import "./token-factory-landing.css";

type LandingProps = {
  onSignIn: () => void;
  heroUrl?: string;
  heroLightUrl?: string;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
};
const providers = [
  { name: "OpenAI", id: "openai", file: "openai.svg" },
  { name: "Anthropic", id: "anthropic", file: "anthropic.svg" },
  { name: "Google Gemini", id: "gemini", file: "gemini.svg" },
  { name: "DeepSeek", id: "deepseek", file: "deepseek.svg" },
  { name: "Qwen", id: "qwen", file: "qwen.png" },
  { name: "Mistral", id: "mistral", file: "mistral.svg" },
  { name: "Kimi", id: "kimi", file: "kimi.svg" },
  { name: "MiniMax", id: "minimax", file: "minimax.webp" },
  { name: "Seedance", id: "seedance", file: "" },
].sort((a, b) => providerPopularityRank(a.name) - providerPopularityRank(b.name));
const questions = [
  {
    question: "What am I purchasing?",
    answer:
      "Credit for your Vishwa workspace. One balance gives you access to the models in the catalog, with usage charged at each model’s input and output rates.",
  },
  {
    question: "Do I need to change my SDK?",
    answer:
      "Use an OpenAI-compatible SDK with the Vishwa endpoint and your API key. Select a model by its ID and keep your existing request structure.",
  },
  {
    question: "How is token usage priced?",
    answer:
      "Input and output tokens are priced separately for each model. Your activity view shows the token counts, applied rates, and cost of each request.",
  },
];
function ProviderMarquee() {
  return (
    <section className="lp-providers" aria-label="Model providers">
      <ul className="lp-sr-only">
        {providers.map((p) => (
          <li key={p.name}>{p.name}</li>
        ))}
      </ul>
      <div className="lp-marquee" aria-hidden="true">
        <div className="lp-marquee-track">
          {[0, 1].map((copy) => (
            <div className="lp-marquee-group" key={copy}>
              {providers.map(({ id, name, file }) => (
                <div className={"lp-provider lp-provider-" + id} key={id}>
                  {id === "seedance" ? (
                    <span className="lp-seedance-wordmark">Seedance</span>
                  ) : (
                    <img
                      src={"./provider-logos/" + file}
                      alt={name}
                      loading="eager"
                      decoding="async"
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
export function Landing({ onSignIn }: LandingProps) {
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);
  return (
    <div className="tf-landing">
      <div className="vg-landing lp-landing">
        <TokenFactoryHeader Brand={Brand} onSignIn={onSignIn} />
        <main>
          <TokenFactoryHero
            onSignIn={onSignIn}
            onExplore={() => scrollToSection("lp-product-title")}
          />
          <ProviderMarquee />
          <section className="lp-container lp-product-section" aria-labelledby="lp-product-title">
            <div className="lp-section-intro">
              <h2 id="lp-product-title">
                Built for how
                <br />
                <span>you build.</span>
              </h2>
            </div>
            <LandingProduct />
          </section>
          <TokenFactoryBalance
            icons={{ Fiat: CreditCard, Crypto: Wallet, Key: KeyRound, OpenAI, Anthropic, Gemini }}
          />
          <section className="lp-container lp-faq" aria-labelledby="lp-faq-title">
            <div>
              <h2 id="lp-faq-title">
                Clarity,
                <br />
                <span>from the start.</span>
              </h2>
            </div>
            <div className="lp-faq-list">
              {questions.map((item, i) => (
                <div className="lp-faq-item" key={item.question}>
                  <h3>
                    <button
                      aria-expanded={openQuestion === i}
                      aria-controls={"lp-answer-" + i}
                      id={"lp-question-" + i}
                      onClick={() => setOpenQuestion(openQuestion === i ? null : i)}
                    >
                      {item.question}
                      <ChevronDown size={20} />
                    </button>
                  </h3>
                  <div
                    id={"lp-answer-" + i}
                    role="region"
                    aria-labelledby={"lp-question-" + i}
                    hidden={openQuestion !== i}
                  >
                    <p>{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="lp-container lp-closing">
            <div className="lp-closing-horizon" aria-hidden="true" />
            <h2>Build what comes next.</h2>
            <button className="lp-button lp-primary" onClick={onSignIn}>
              Start building
              <ArrowRight size={18} />
            </button>
          </section>
        </main>
        <footer className="lp-container lp-footer">
          <Brand />
          <span>© {new Date().getFullYear()} Vishwa</span>
        </footer>
      </div>
    </div>
  );
}
