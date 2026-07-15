import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "keeplink_auth_token";
const USER_ID_KEY = "keeplink_user_id";

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getUserId(): Promise<string | null> {
  return SecureStore.getItemAsync(USER_ID_KEY);
}

export async function setUserId(id: string): Promise<void> {
  return SecureStore.setItemAsync(USER_ID_KEY, id);
}

export async function clearUserId(): Promise<void> {
  return SecureStore.deleteItemAsync(USER_ID_KEY);
}
