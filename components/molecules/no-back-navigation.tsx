"use client";
// ブラウザの戻るボタンを無効にするコンポーネント。
// マウント時に履歴エントリを追加し、popstate 発火時に指定先へリダイレクトする。
// 戻らせたいページで <NoBackNavigation redirectTo="/" /> のように配置するだけで使える。
import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  redirectTo?: string;
};

export function NoBackNavigation({ redirectTo = "/" }: Props) {
  const router = useRouter();

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    function handlePopState() {
      window.history.pushState(null, "", window.location.href);
      router.replace(redirectTo);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [redirectTo, router]);

  return null;
}
