/**
 * Thrown when a property mutation reported success but the follow-up
 * persistence probe (re-query or field verification) failed.
 *
 * Negative scenarios must never record this as the expected business
 * rejection: it means the write actually committed (or the backend broke
 * mid-verification), so attempt tasks rethrow it to fail the scenario loudly
 * instead of letting an unauthorized-but-committed write masquerade as a
 * rejection.
 */
export class PropertyPostCommitProbeError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'PropertyPostCommitProbeError';
	}
}
