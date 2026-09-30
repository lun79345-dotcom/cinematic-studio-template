export type Localized<T> = {
  zh: T;
  en: T;
};

export type HomeBrand = {
  id: string;
  name: Localized<string>;
  logo: string;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
};

export type HomeBrandInput = Omit<HomeBrand, "id" | "createdAt" | "updatedAt">;

export type HomeServiceIconKey = "film" | "book-open" | "wand-sparkles" | "clapperboard";

export type HomeServiceMedia =
  | {
      type: "image";
      src: string;
    }
  | {
      type: "video";
      src: string;
      poster?: string;
    };

export type ServiceSection = {
  heading: Localized<string>;
  body: Localized<string>;
  image?: string;
  imageAlt?: Localized<string>;
};

export type Service = {
  id: string;
  slug: string;
  name: Localized<string>;
  label: Localized<string>;
  description: Localized<string>;
  seoDescription?: Localized<string>;
  features: Localized<string[]>;
  sections: ServiceSection[];
  media: HomeServiceMedia;
  imageAlt: Localized<string>;
  imagePosition: string;
  iconKey: HomeServiceIconKey;
  showOnHome: boolean;
  showInNavigation: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ServiceInput = Omit<Service, "id" | "createdAt" | "updatedAt">;

export type ServiceNavigationItem = Pick<Service, "slug" | "name" | "description" | "features" | "showInNavigation">;

// Transitional aliases keep existing homepage component imports stable.
export type HomeService = Service;
export type HomeServiceInput = ServiceInput;

export type HomeContent = {
  brands: HomeBrand[];
  services: Service[];
  homeCaseSlugs: string[];
};
