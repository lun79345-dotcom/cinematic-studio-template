"use client";

import { usePreferences } from "@/components/providers/PreferencesProvider";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export function NotFoundContent() {
  const { copy } = usePreferences();
  return (
    <Container className="flex min-h-[75dvh] flex-col items-center justify-center pb-20 pt-36 text-center">
      <p className="font-mono text-sm tracking-[0.2em] text-gold">404</p>
      <h1 className="mt-6 max-w-4xl font-display text-4xl leading-tight sm:text-6xl">{copy.notFound.title}</h1>
      <p className="mt-6 max-w-xl text-base leading-7 text-mist">{copy.notFound.description}</p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Button href="/">{copy.notFound.home}</Button>
        <Button href="/#cases" variant="secondary">{copy.notFound.cases}</Button>
        <Button href="/contact" variant="secondary">{copy.notFound.contact}</Button>
      </div>
    </Container>
  );
}
