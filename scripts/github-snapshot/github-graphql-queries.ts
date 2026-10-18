// GraphQL documents for the snapshot fetch. Field names match RawRepo / RawContributions.
const TREE = '... on Tree { entries { name } }';

export const PROFILE_QUERY = `query($login: String!) {
  rateLimit { cost remaining }
  user(login: $login) {
    login createdAt
    pinnedItems(first: 6, types: REPOSITORY) { nodes { ... on Repository { name isPrivate owner { login } } } }
  }
}`;

export const REPOS_QUERY = `query($login: String!, $first: Int!, $after: String) {
  rateLimit { cost remaining }
  user(login: $login) {
    repositories(first: $first, after: $after, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC,
                 orderBy: { field: NAME, direction: ASC }) { # stable while paging (pushes reorder PUSHED_AT)
      pageInfo { hasNextPage endCursor }
      nodes {
        name url description homepageUrl isArchived isFork isPrivate createdAt pushedAt stargazerCount
        licenseInfo { spdxId }
        primaryLanguage { name }
        repositoryTopics(first: 20) { nodes { topic { name } } }
        languages(first: 20, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name } } }
        root: object(expression: "HEAD:") { ${TREE} }
        dotGithub: object(expression: "HEAD:.github") { ${TREE} }
        workflows: object(expression: "HEAD:.github/workflows") { ${TREE} }
      }
    }
  }
}`;

export const CONTRIBUTIONS_QUERY = `query($login: String!, $from: DateTime!, $to: DateTime!) {
  rateLimit { cost remaining }
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions totalPullRequestContributions totalIssueContributions
      totalPullRequestReviewContributions
      contributionCalendar { weeks { contributionDays { date contributionCount } } }
      commitContributionsByRepository(maxRepositories: 100) {
        repository { nameWithOwner isPrivate } contributions { totalCount }
      }
    }
  }
}`;
