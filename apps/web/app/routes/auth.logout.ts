import { redirect } from "react-router";
import { createLogoutCookie } from "~/auth/session.server";

export async function loader() {
  return redirect("/", {
    headers: [["Set-Cookie", createLogoutCookie()]],
  });
}
