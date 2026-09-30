export type PublicAssetKind = "image" | "video" | "other";

export type PublicAsset = {
  name: string;
  path: string;
  type: "file" | "directory";
  kind: PublicAssetKind;
  url: string;
  mime: string | null;
  mimeType: string | null;
  size: number | null;
  modifiedAt: string;
  writable: boolean;
  readOnly: boolean;
};

export type PublicDirectoryListing = {
  path: string;
  parent: string | null;
  writable: boolean;
  readOnly: boolean;
  items: PublicAsset[];
};
