/** Escapes HTML-sensitive characters for safe inline rendering. */
function escapeHtml(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

/** Builds the mock login page HTML. */
export function buildLoginHtml(opts: { issuerBaseUrl: string; nonce?: string; username?: string; error?: string }) {
	const { issuerBaseUrl, nonce, username, error } = opts;
	return `<!doctype html><html><head><meta charset="utf-8"><title>Mock Login</title></head><body>
			<h1>Login</h1>
			${error ? `<p style="color: red;"><span class="error">${escapeHtml(error)}</span></p>` : ''}
			<form method="POST" action="${issuerBaseUrl}/login?nonce=${nonce ?? ''}">
			<input type="hidden" name="nonce" value="${nonce ?? ''}" />
			<label>Username: <input name="username" value="${escapeHtml(username ?? '')}" /></label><br/>
			<label>Password: <input name="password" type="password" /></label><br/>
			<button type="submit">Login</button>
			</form>
			<p><a href="${issuerBaseUrl}/signup?nonce=${nonce ?? ''}">Sign up</a></p>
			</body></html>`;
}

/** Builds the mock signup page HTML. */
export function buildSignupHtml(opts: { issuerBaseUrl: string; nonce?: string; username?: string; email?: string; given_name?: string; family_name?: string; error?: string }) {
	const { issuerBaseUrl, nonce, username, email, given_name, family_name, error } = opts;
	return `<!doctype html><html><head><meta charset="utf-8"><title>Mock Signup</title></head><body>
			<h1>Sign up</h1>
			${error ? `<p style="color: red;"><span class="error">${escapeHtml(error)}</span></p>` : ''}
			<form method="POST" action="${issuerBaseUrl}/signup">
			<input type="hidden" name="nonce" value="${nonce ?? ''}" />
			<label>Username: <input name="username" value="${escapeHtml(username ?? '')}" /></label><br/>
			<label>Password: <input name="password" type="password" /></label><br/>
			<label>Email: <input name="email" value="${escapeHtml(email ?? '')}" /></label><br/>
			<label>Given name: <input name="given_name" value="${escapeHtml(given_name ?? '')}" /></label><br/>
			<label>Family name: <input name="family_name" value="${escapeHtml(family_name ?? '')}" /></label><br/>
			<button type="submit">Sign up</button>
			</form>
			</body></html>`;
}
