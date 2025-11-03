type OIDCConfig = {
  authority: string
  client_id: string
  redirect_uri: string
  code_verifier: boolean
  noonce: boolean
  response_type: string
  scope: string
  onSigninCallback: () => void
}


export const oidcConfig: OIDCConfig = {
  // biome-ignore lint:useLiteralKeys
  authority: import.meta.env['VITE_AAD_B2C_ACCOUNT_AUTHORITY'] ?? "http://localhost:4000",
  // biome-ignore lint:useLiteralKeys
  client_id:  import.meta.env['VITE_AAD_B2C_ACCOUNT_CLIENTID'] ?? "mock-client", 
  // biome-ignore lint:useLiteralKeys
  redirect_uri: import.meta.env['VITE_AAD_B2C_REDIRECT_URI'] ?? "http://localhost:3000/auth-redirect",
  code_verifier: true,
  noonce: true,
  response_type: 'code',
  // biome-ignore lint:useLiteralKeys
  scope: import.meta.env['VITE_AAD_B2C_ACCOUNT_SCOPES'],
  onSigninCallback: (): void => {
    console.log('onSigninCallback');
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );
    const redirectToPath = window.sessionStorage.getItem('redirectTo');
    if (redirectToPath){
        window.location.pathname = redirectToPath;
        window.sessionStorage.removeItem('redirectTo');
    }
  }
}
