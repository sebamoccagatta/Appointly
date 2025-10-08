export const OfferingStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;
export type OfferingStatus =
  (typeof OfferingStatus)[keyof typeof OfferingStatus];

export interface Offering {
  id: string;
  name: string;
  durationMinutes: number;
  price?: number;
  status: OfferingStatus;
  createdAt: Date;
  updatedAt: Date;
}
