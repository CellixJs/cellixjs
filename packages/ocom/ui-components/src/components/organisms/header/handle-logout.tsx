import type { ApolloClient } from "@apollo/client";
import type { AuthContextProps } from "react-oidc-context";

export const HandleLogout = (auth: AuthContextProps, apolloClient: ApolloClient<object>, post_logout_redirect_uri?: string) => {
  // Please do not put await before these 2 functions auth.removeUser() and auth.signoutRedirect() for it will break the logout
  auth.removeUser();
  apolloClient.clearStore();
  if (post_logout_redirect_uri) {
    auth.signoutRedirect({
      post_logout_redirect_uri: post_logout_redirect_uri,
    });

    return;
  }

  auth.signoutRedirect();
};
