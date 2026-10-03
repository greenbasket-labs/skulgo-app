export type SchoolSectionType = "Nursery" | "Primary" | "Junior" | "Senior" | "Custom";

export interface SchoolSection {
  sectionId: string;
  schoolId: string;
  name: string;
  type: SchoolSectionType;
  createdAt: string;
}
