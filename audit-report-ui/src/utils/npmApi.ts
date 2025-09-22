// Utility to fetch latest version from npm registry
export async function fetchLatestVersion(pkg: string): Promise<string> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${pkg}`);
    if (!res.ok) return '';
    const data = await res.json();
    if (data && data['dist-tags'] && data['dist-tags'].latest) {
      return data['dist-tags'].latest;
    }
    return '';
  } catch {
    return '';
  }
}
