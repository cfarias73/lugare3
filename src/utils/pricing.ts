export interface PricingConfig {
  basePrice: number;
  baseCapacity: number;
  includedHours: number;
  extraPersonPrice: number; // por persona por hora
  extraHourPrice: number;
}

export interface PricingInput extends PricingConfig {
  guests: number;
  hours: number;
}

export interface PricingBreakdown {
  basePrice: number;
  extraPeople: number;
  extraPeopleCost: number;
  extraHours: number;
  extraHoursCost: number;
  total: number;
}

export const calcVenuePricing = (input: PricingInput): PricingBreakdown => {
  const extraPeople = Math.max(0, (input.guests || 0) - (input.baseCapacity || 0));
  const extraHours = Math.max(0, (input.hours || 0) - (input.includedHours || 0));
  const extraPeopleCost = extraPeople * (input.extraPersonPrice || 0) * (input.hours || 0);
  const extraHoursCost = extraHours * (input.extraHourPrice || 0);
  return {
    basePrice: input.basePrice || 0,
    extraPeople,
    extraPeopleCost,
    extraHours,
    extraHoursCost,
    total: (input.basePrice || 0) + extraPeopleCost + extraHoursCost,
  };
};
