import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import apiClient from '@/lib/api';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await apiClient.login({
            email: credentials.email,
            password: credentials.password,
          });

          const { user, accessToken, refreshToken } = response.data;

          // Store tokens in a way they can be accessed by the client
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            image: user.profileImage,
            accessToken,
            refreshToken,
            role: user.role,
            userType: user.userType,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }: any) {
      if (user && account) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.role = user.role;
        token.userType = user.userType;
      }
      return token;
    },
    async session({ session, token }: any) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.role = token.role as string;
      session.userType = token.userType as string;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
});

export { handler as GET, handler as POST };