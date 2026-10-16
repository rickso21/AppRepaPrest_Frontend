import Constants from "expo-constants";

// Tipo de link (debe coincidir con LinkPreview.tsx)
export type LinkTipo =
  | "youtube"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "twitter"
  | "vimeo"
  | "spotify"
  | "linkedin"
  | "whatsapp"
  | "maps";

// Detección de tipo de link (incluye maps)
export function detectarTipoLink(url: string): LinkTipo | null {
  const u = url.toLowerCase();

  if (/youtube\.com|youtu\.be/.test(u)) return "youtube";
  if (/facebook\.com|fb\.watch/.test(u)) return "facebook";
  if (/instagram\.com/.test(u)) return "instagram";
  if (/tiktok\.com/.test(u)) return "tiktok";
  if (/twitter\.com|x\.com/.test(u)) return "twitter";
  if (/vimeo\.com/.test(u)) return "vimeo";
  if (/spotify\.com/.test(u)) return "spotify";
  if (/linkedin\.com/.test(u)) return "linkedin";
  if (/wa\.me|whatsapp\.com/.test(u)) return "whatsapp";

  // Google Maps — debe ir ANTES que cualquier regla de google genérico
  if (
    /google\.[a-z.]+\/maps/.test(u) ||
    /maps\.google\.[a-z.]+/.test(u) ||
    /maps\.app\.goo\.gl/.test(u) ||
    /goo\.gl\/maps/.test(u)
  ) {
    return "maps";
  }

  return null;
}

// Extrae URLs del texto de un post
export function extraerUrls(texto: string): string[] {
  const regex = /https?:\/\/[^\s]+/g;
  return texto.match(regex) ?? [];
}

export function extraerCoordsMaps(
  url: string,
): { lat: number; lng: number } | null {
  // 1) /@lat,lng,zoom
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }

  // 2) parámetros query
  const paramMatch = url.match(
    /[?&](?:q|query|ll|destination|center)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
  );
  if (paramMatch) {
    return { lat: parseFloat(paramMatch[1]), lng: parseFloat(paramMatch[2]) };
  }

  return null;
}

function getGoogleMapsKey(): string {
  const key = Constants.expoConfig?.extra?.googleMapsApiKey as
    | string
    | undefined;

  if (!key) {
    //if (__DEV__) console.warn("[mapsLink] API key no encontrada en extra");
    return "";
  }
  return key;
}

// Genera la URL de Static Maps
export function buildStaticMapUrl(
  lat: number,
  lng: number,
  opts?: { width?: number; height?: number; zoom?: number },
): string {
  const key = getGoogleMapsKey();
  if (!key) {
    //if (__DEV__) console.warn("[mapsLink] Falta la Google Maps API key");
    return "";
  }

  const w = opts?.width ?? 600;
  const h = opts?.height ?? 300;
  const z = opts?.zoom ?? 15;
  const center = `${lat},${lng}`;

  const params = new URLSearchParams({
    center,
    zoom: String(z),
    size: `${w}x${h}`,
    scale: "2",
    markers: `color:red|${center}`,
    key,
  });

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

export async function resolverUrlMaps(url: string): Promise<string> {
  // console.log("[resolverUrlMaps] INICIO con:", url);

  if (!/goo\.gl|maps\.app\.goo\.gl/.test(url)) {
    // console.log("[resolverUrlMaps] No es URL acortada, devuelvo igual");
    return url;
  }

  try {
    //console.log("[resolverUrlMaps] Haciendo HEAD...");
    const res = await fetch(url, { method: "HEAD", redirect: "manual" });

    //console.log("[resolverUrlMaps] status:", res.status);
    //console.log("[resolverUrlMaps] type:", res.type);
    //console.log("[resolverUrlMaps] url:", res.url);

    const location = res.headers.get("location");
    if (location) {
      return location;
    }

    if (res.url && res.url !== url) {
      return res.url;
    }

    return url;
  } catch (e) {
    return url;
  }
}
