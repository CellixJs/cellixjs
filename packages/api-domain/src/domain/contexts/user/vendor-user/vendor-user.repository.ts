import { VendorUser, type VendorUserProps } from './vendor-user.ts';
import { DomainSeedwork } from '@cellix/domain-seedwork';

export interface VendorUserRepository<props extends VendorUserProps> extends DomainSeedwork.Repository<VendorUser<props>> {
  delete(id:string): Promise<void>;
  getByExternalId(externalId:string): Promise<VendorUser<props>>;
  getNewInstance(externalId: string, lastName: string, restOfName?: string): Promise<VendorUser<props>>;
}