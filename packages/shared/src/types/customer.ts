import { PaymentTerms } from "../enums.js";

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;
  isTaxExempt: boolean;
  paymentTerms: PaymentTerms;
  createdAt: string;
  updatedAt: string;
}

export type CreateCustomerInput = Pick<Customer, "name"> &
  Partial<
    Omit<Customer, "id" | "name" | "createdAt" | "updatedAt" | "country">
  >;
