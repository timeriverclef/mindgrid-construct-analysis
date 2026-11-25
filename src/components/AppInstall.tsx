import { useEffect, useRef, useState } from "react";
import { MonitorDown } from "lucide-react";

interface InstallPrompt extends Event {
  prompt(): Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function AppInstall() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(
    () => matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
  );
  const [ready, setReady] = useState(!!navigator.serviceWorker?.controller);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const onInstall = () => {
      setPrompt(null);
      setInstalled(true);
      dialog.current?.close();
    };
    const onReady = () => setReady(!!navigator.serviceWorker?.controller);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstall);
    navigator.serviceWorker?.addEventListener("controllerchange", onReady);
    onReady();
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstall);
      navigator.serviceWorker?.removeEventListener("controllerchange", onReady);
    };
  }, []);
  const install = async () => {
    if (prompt) {
      setPrompt(null);
      try {
        await prompt.prompt();
      } catch {
        dialog.current?.showModal();
      }
    } else {
      dialog.current?.showModal();
    }
  };
  return <>
    <button className="quiet" onClick={install}>
      <MonitorDown size={17} /> <span>{installed ? "应用说明" : "安装"}</span>
    </button>
    <dialog className="confirm-dialog app-install" ref={dialog} aria-labelledby="install-title">
      <h2 id="install-title">{installed ? "关于心格应用" : "把心格安装到设备"}</h2>
      {!installed && <ul>
        <li><strong>iPhone / iPad：</strong>在 Safari 打开，点「分享」→「添加到主屏幕」。如果看到「打开为网页 App」，请保持开启。</li>
        <li><strong>Android：</strong>在 Chrome 的菜单中选「安装应用」或「添加到主屏幕」。</li>
        <li><strong>Windows / macOS：</strong>在 Chrome 或 Edge 地址栏点安装图标；Mac 也可在 Safari 中选择「文件」→「添加到程序坞」。</li>
      </ul>}
      <p role="status">{ready ? "当前窗口的心格已准备好离线打开。" : "安装后先联网从图标打开一次，等这里提示可以离线打开，再断网使用。"}</p>
      <p>Safari 网页和安装后的应用不共享本地记录，即使在同一台设备上也是如此。原记录仍在 Safari。要带到应用里，先在原网页点「备份」，再从图标打开应用并点「导入」。如需下次继续，勾选「在此设备保留进度」。</p>
      <p className="small">换设备也可用同样的步骤。咨询师私人笔记默认不随备份导出，如需迁移请在备份时明确勾选。</p>
      <form method="dialog" className="app-install-close"><button className="primary" autoFocus>知道了</button></form>
    </dialog>
  </>;
}
