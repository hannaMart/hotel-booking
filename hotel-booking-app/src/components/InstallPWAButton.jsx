import { useEffect, useState } from "react";

export default function InstallPWAButton() {
  const [installEvent, setInstallEvent] = useState(null);

  useEffect(() => {
    const saveInstallEvent = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };

    window.addEventListener("beforeinstallprompt", saveInstallEvent);

    return () => {
      window.removeEventListener("beforeinstallprompt", saveInstallEvent);
    };
  }, []);

  const installApp = async () => {
    if (!installEvent) return;

    installEvent.prompt();
    await installEvent.userChoice;

    setInstallEvent(null);
  };

  if (!installEvent) return null;

  return (
    <button className="btn btn-primary btn-sm" onClick={installApp}>
      Install app
    </button>
  );
}