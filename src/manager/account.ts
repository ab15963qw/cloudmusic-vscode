import * as queryString from "querystring";
import type { LoginParameters, PlaylistItem } from "../constant";
import {
  apiDailySignin,
  apiLikelist,
  apiLogout,
  apiUserPlaylist,
  base,
  cookieToJson,
  userAgentList,
  weapi,
} from "../api";
import type { Cookie } from "../api";
import { LoggedIn } from "../state";
import axios from "axios";
import { i18n } from "../i18n";
import { window } from "vscode";

export class AccountManager {
  static uid = 0;

  static nickname = "";

  static likelist: Set<number> = new Set<number>();

  static async dailySignin(): Promise<void> {
    if (LoggedIn.get()) {
      if (await apiDailySignin()) {
        void window.showInformationMessage(i18n.sentence.success.dailyCheck);
      }
    } else {
      void window.showErrorMessage(i18n.sentence.error.needSignIn);
    }
  }

  static async login({
    phone,
    username,
    password,
    countrycode = "86",
  }: LoginParameters): Promise<boolean> {
    if (LoggedIn.get()) {
      void window.showInformationMessage(i18n.sentence.info.alreadySignIn);
      return true;
    }
    const usePhone = phone.length > 0;
    try {
      const url = usePhone
        ? "https://music.163.com/weapi/login/cellphone"
        : "https://music.163.com/weapi/login";
      const headers = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Referer: "https://music.163.com",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Cookie: `os=pc`,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "Content-Type": "application/x-www-form-urlencoded",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "User-Agent":
          userAgentList.pc[Math.floor(Math.random() * userAgentList.pc.length)],
      };

      const data = weapi({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        csrf_token: "",
        password,
        rememberLogin: "true",
        ...(usePhone ? { phone, countrycode } : { username }),
      });

      const res = await axios.post<{
        code?: number;
        profile: { userId: number; nickname: string };
      }>(url, queryString.stringify(data), { headers });

      if (res.data.code || res.status === 200) {
        const { userId, nickname } = res.data.profile;
        base.cookie = cookieToJson(
          (
            (res.headers as { "set-cookie"?: string[] })["set-cookie"] || []
          ).map((x) => x.replace(/\s*Domain=[^(;|$)]+;*/, ""))
        );
        this.uid = userId;
        this.nickname = nickname;
        const ids = await apiLikelist();
        ids.forEach((id) => this.likelist.add(id));
        LoggedIn.set(true);
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  }

  static async logout(): Promise<boolean> {
    if (await apiLogout()) {
      base.cookie = {} as Cookie;
      this.uid = 0;
      this.nickname = "";
      this.likelist.clear();
      LoggedIn.set(false);
      return true;
    }
    return false;
  }

  static async userPlaylist(): Promise<PlaylistItem[]> {
    if (this.uid === 0) {
      return [];
    }
    const lists = await apiUserPlaylist(this.uid);
    return lists.filter((list) => list.creator.userId === this.uid);
  }

  static async favoritePlaylist(): Promise<PlaylistItem[]> {
    if (this.uid === 0) {
      return [];
    }
    const lists = await apiUserPlaylist(this.uid);
    return lists.filter((list) => list.creator.userId !== this.uid);
  }
}
