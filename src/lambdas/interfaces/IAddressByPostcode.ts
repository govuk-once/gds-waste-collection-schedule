import z from 'zod';

export const IAddressByPostcodeSchema = z.object({
  addressFull: z.string(),
  uprn: z.string(),
  localCustodianCode: z.string(),
});

export type IAddressByPostcode = z.infer<typeof IAddressByPostcodeSchema>;
