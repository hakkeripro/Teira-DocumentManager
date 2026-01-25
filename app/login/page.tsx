import LoginUI from './ui';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const nextParam = sp && typeof sp.next === 'string' ? sp.next : undefined;

  return <LoginUI nextPath={nextParam} />;
}
