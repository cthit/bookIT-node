import { print } from "graphql";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";

let redirectingToLogin = false;

export async function request<T, V extends Record<string, unknown>>(
  document: TypedDocumentNode<T, V>,
  variables: V,
): Promise<T> {
  const response = await fetch("/api/graphql/v1", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: print(document), variables }),
  });

  if (response.status === 401 || response.redirected) {
    if (!redirectingToLogin) {
      redirectingToLogin = true;
      window.location.replace("/api/login");
    }

    throw new Error("Your session expired. Please sign in again.");
  }

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}). Please try again.`);
  }

  const result = (await response.json()) as { data?: T; errors?: { message: string }[] };

  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join(". "));
  }

  if (!result.data) {
    throw new Error("The server returned no data.");
  }

  return result.data;
}

export function checkMutation(
  error: { en: string; sv: string } | null | undefined,
  language: "en" | "sv",
) {
  if (error) {
    throw new Error(error[language]);
  }
}
