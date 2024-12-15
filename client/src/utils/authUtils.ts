const TOKEN_KEY = 'accessToken';

export const getAuthHeader = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? `Bearer ${token}` : null;
};
