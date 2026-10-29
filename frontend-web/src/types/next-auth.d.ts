declare module 'next-auth' {
  const NextAuth: any;
  export default NextAuth;
}

declare module 'next-auth/providers/credentials' {
  const CredentialsProvider: any;
  export default CredentialsProvider;
}

declare module 'next-auth/react' {
  export const getSession: any;
}
