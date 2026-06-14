import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.toLowerCase().trim();
        try {
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || !user.passwordHash) return null;
          const valid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!valid) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.displayName || user.name || user.email?.split('@')?.[0] || '',
            role: user.role,
            subscription: user.subscription,
          };
        } catch (e) {
          console.error('Auth error:', e);
          return null;
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user?.email) {
        try {
          const email = user.email.toLowerCase().trim();
          const existing = await prisma.user.findUnique({ where: { email } });
          if (!existing) {
            await prisma.user.create({
              data: {
                email,
                name: user.name || email.split('@')[0],
                displayName: user.name || email.split('@')[0],
                avatarUrl: (user as any).image || null,
                oauthProvider: 'google',
                role: email === (process.env.ADMIN_EMAIL || '') ? 'admin' : 'seeker',
                subscription: 'free',
              },
            });
          } else {
            await prisma.user.update({
              where: { email },
              data: {
                avatarUrl: existing.avatarUrl || (user as any).image || null,
                displayName: existing.displayName || user.name || undefined,
                oauthProvider: existing.oauthProvider || 'google',
              },
            });
          }
        } catch (e) {
          console.error('Google signIn callback error:', e);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || 'seeker';
        token.subscription = (user as any).subscription || 'free';
      }
      // Refresh from DB on each token refresh
      if (token.email) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { email: token.email as string } });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.subscription = dbUser.subscription;
            token.displayName = dbUser.displayName;
          }
        } catch (e) {
          // Ignore DB errors during token refresh
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).subscription = token.subscription as string;
        (session.user as any).displayName = token.displayName as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    state: {
      name: '__Secure-next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 900,
      },
    },
    pkceCodeVerifier: {
      name: '__Secure-next-auth.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 900,
      },
    },
  },
};
