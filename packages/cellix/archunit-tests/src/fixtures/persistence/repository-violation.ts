// Fixture: Persistence repository convention violation
// Missing MongoRepositoryBase extension and Domain.Contexts implementation
export class BadRepository {
	findById(id: string) {
		return { id };
	}
}
