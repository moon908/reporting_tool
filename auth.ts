// Mocked Authentication session for Bypass Mode
export const auth = async () => {
  return {
    user: {
      id: "mock-user-id",
      name: "Spectra Admin",
      email: "admin@acme.com",
      role: "Admin",
      organizationId: "default-org-id",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
};

export const handlers = {
  GET: async () => new Response("Bypassed NextAuth GET Handlers"),
  POST: async () => new Response("Bypassed NextAuth POST Handlers"),
};

export const signIn = async () => {};
export const signOut = async () => {};
