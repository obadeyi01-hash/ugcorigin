type Listener = (owner: string | null) => void;

let owner: string | null = null;
const listeners = new Set<Listener>();

function pauseOthers(active: string) {
  if (typeof document === "undefined") return;
  document.querySelectorAll("video, audio").forEach((node) => {
    const media = node as HTMLMediaElement;
    if (media.dataset.mediaOwner === active) return;
    media.pause();
  });
}

/** One clip owns playback. Everything else on the page pauses. */
export function claimMedia(id: string) {
  owner = id;
  pauseOthers(id);
  listeners.forEach((listener) => listener(owner));
}

export function releaseMedia(id: string) {
  if (owner !== id) return;
  owner = null;
  listeners.forEach((listener) => listener(null));
}

export function subscribeMedia(listener: Listener) {
  listeners.add(listener);
  listener(owner);
  return () => {
    listeners.delete(listener);
  };
}
