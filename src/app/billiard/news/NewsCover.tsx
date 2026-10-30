export function NewsCover({ url, alt = "" }: { url?: string | null; alt?: string }) {
  if (!url) {
    return (
      <div
        aria-hidden
        className="float-left mb-2 mr-3 h-[120px] w-[90px] rounded-md bg-gradient-to-b from-violet-800/50 to-[#0b0f1a]"
      />
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      width={90}
      height={120}
      className="float-left mb-2 mr-3 h-[120px] w-[90px] rounded-md object-cover"
    />
  );
}
