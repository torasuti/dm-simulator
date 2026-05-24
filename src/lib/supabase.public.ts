const disabledError = new Error('Supabase is disabled in the public build');

export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: disabledError }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe() {},
        },
      },
    }),
    signOut: async () => ({ error: null }),
    signInWithPassword: async () => ({ error: disabledError }),
    signUp: async () => ({ error: disabledError }),
    signInWithOAuth: async () => ({ error: disabledError }),
  },
  from() {
    throw disabledError;
  },
};
