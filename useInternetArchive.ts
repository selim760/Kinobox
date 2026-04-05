import { useQuery } from "@tanstack/react-query";

interface IAItem {
  identifier: string;
  title: string;
  description?: string;
}

interface IAFile {
  name: string;
  format: string;
  source: string;
}

async function searchArchive(title: string): Promise<string | null> {
  if (!title) return null;

  // Search Internet Archive for the movie/show
  const query = encodeURIComponent(`title:(${title}) AND mediatype:(movies)`);
  const url = `https://archive.org/advancedsearch.php?q=${query}&fl[]=identifier,title,description&rows=5&output=json`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const docs: IAItem[] = data?.response?.docs || [];
  if (docs.length === 0) return null;

  // Try to find an mp4 file in the first matching result
  for (const doc of docs) {
    const filesUrl = `https://archive.org/metadata/${doc.identifier}/files`;
    const filesRes = await fetch(filesUrl);
    if (!filesRes.ok) continue;

    const filesData = await filesRes.json();
    const files: IAFile[] = filesData?.result || [];

    const mp4 = files.find(
      (f) =>
        f.name.endsWith(".mp4") &&
        f.format?.toLowerCase().includes("mpeg4") &&
        f.source === "original"
    ) || files.find((f) => f.name.endsWith(".mp4"));

    if (mp4) {
      return `https://archive.org/download/${doc.identifier}/${encodeURIComponent(mp4.name)}`;
    }
  }

  return null;
}

export function useInternetArchive(title: string, enabled = true) {
  return useQuery({
    queryKey: ["internet-archive", title],
    queryFn: () => searchArchive(title),
    enabled: enabled && !!title,
    staleTime: 1000 * 60 * 30, // 30 min cache
    retry: 1,
  });
}
