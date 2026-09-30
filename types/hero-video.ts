export type HeroVideo = {
  id: string;
  name: {
    zh: string;
    en: string;
  };
  src: string;
  poster?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type HeroVideoInput = Omit<HeroVideo, "id" | "createdAt" | "updatedAt">;
