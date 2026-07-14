export type LinkStatus = "UNREAD" | "READ" | "ARCHIVED";

export interface Tag {
  id: string;
  name: string;
}

export interface LinkWithTags {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  favicon: string | null;
  domain: string;
  readingTime: number | null;
  status: LinkStatus;
  addedAt: string;
  readAt: string | null;
  archivedAt: string | null;
  tags: { tag: Tag }[];
}

export interface TagWithCount {
  id: string;
  name: string;
  count: number;
}
