import type { ComponentType, ReactElement } from "react";

type LandingIcon = ComponentType<{ size?: number }>;

export function TokenFactoryHeader(props: {
  Brand: ComponentType;
  onSignIn: () => void;
}): ReactElement;

export function TokenFactoryHero(props: {
  onSignIn: () => void;
  onExplore: () => void;
}): ReactElement;

export function TokenFactoryBalance(props: {
  icons: {
    Fiat: LandingIcon;
    Crypto: LandingIcon;
    Key: LandingIcon;
    OpenAI: LandingIcon;
    Anthropic: LandingIcon;
    Gemini: LandingIcon;
  };
}): ReactElement;

export function scrollToSection(id: string): void;
