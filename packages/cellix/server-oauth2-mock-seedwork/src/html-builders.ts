interface BuildLoginHtmlOptions {
	issuerBaseUrl: string;
	nonce?: string;
	username?: string;
	error?: string;
}

interface BuildSignupHtmlOptions {
	issuerBaseUrl: string;
	nonce?: string;
	username?: string;
	email?: string;
	given_name?: string;
	family_name?: string;
	error?: string;
}

/**
 * Escapes HTML-sensitive characters in a string for safe inline rendering.
 *
 * @param value - The string to escape.
 * @returns The escaped HTML string.
 */
export function escapeHtml(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

/**
 * Builds the mock login page HTML.
 *
 * @param options - Values used to render the login form.
 * @returns A complete HTML document for the login form.
 */
export function buildLoginHtml(options: BuildLoginHtmlOptions): string {
	const { issuerBaseUrl, nonce, username, error } = options;
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

/**
 * Builds the mock signup page HTML.
 *
 * @param options - Values used to render the signup form.
 * @returns A complete HTML document for the signup form.
 */
export function buildSignupHtml(options: BuildSignupHtmlOptions): string {
	const { issuerBaseUrl, nonce, username, email, given_name, family_name, error } = options;
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
