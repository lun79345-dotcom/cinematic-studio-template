export type CaseSection = {
  heading: string;
  body: string;
  image?: string;
  imageAlt?: string;
};

export type CaseHomeMedia =
  | {
      type: "image";
      src: string;
    }
  | {
      type: "video";
      src: string;
      poster?: string;
      autoPlay?: boolean;
    };

export type CaseStudy = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  client: string;
  year: string;
  services: string[];
  coverImage: string;
  coverAlt: string;
  homeMedia?: CaseHomeMedia;
  sections: CaseSection[];
  gallery: string[];
  featured: boolean;
  isSample: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CaseInput = Omit<CaseStudy, "createdAt" | "updatedAt">;
