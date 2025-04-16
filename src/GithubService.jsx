const token = import.meta.env.VITE_API_KEY;

export async function fetchRepositories(org) {
  const endpoint = `https://api.github.com/orgs/${org}/repos?per_page=100`;

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch repositories');
  }

  const data = await response.json();
  return data.map(repo => repo.name);
}

export async function fetchSecurityAlerts(org, repoName) {
  const endpoint = `https://api.github.com/repos/${org}/${repoName}/code-scanning/alerts?per_page=100`;

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch security alerts for ${repoName}`);
  }

  return await response.json();
}
