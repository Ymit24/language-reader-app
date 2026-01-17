import { Redirect } from 'expo-router';
import { useConvexAuth } from 'convex/react';

export default function Index() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)/library" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
