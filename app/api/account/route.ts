import {
  chatGPTSignInPath,
  chatGPTSignOutPath,
  getChatGPTUser,
} from "../../chatgpt-auth";

export async function GET() {
  const user = await getChatGPTUser();
  return Response.json({
    authenticated: Boolean(user),
    user,
    signInPath: chatGPTSignInPath("/"),
    signOutPath: chatGPTSignOutPath("/"),
  });
}
