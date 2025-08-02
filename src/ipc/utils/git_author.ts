import { getGithubUser } from "../handlers/github_handlers";

export async function getGitAuthor() {
  const user = await getGithubUser();
  const author = user
    ? {
        name: `[athena]`,
        email: user.email,
      }
    : {
        name: "[athena]",
        email: "git@dyad.sh",
      };
  return author;
}
