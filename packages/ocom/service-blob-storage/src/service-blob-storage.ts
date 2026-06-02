import { ServiceBlobStorage as CellixServiceBlobStorage } from '@cellix/service-blob-storage';

/**
 * OCOM application-facing blob storage service.
 *
 * This class intentionally extends the framework `ServiceBlobStorage` so application code can
 * import a single OCOM service boundary while still getting the reusable Cellix implementation.
 * OCOM can extend this class later if the application needs additional conventions or defaults.
 */
export class ServiceBlobStorage extends CellixServiceBlobStorage {
}
