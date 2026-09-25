import Image from "next/image";

export function ParliamentEmblem({
  className = "h-10 w-10",
}: {
  className?: string;
}) {
  return (
    <span
      className={
        "relative inline-flex items-center justify-center overflow-hidden rounded-full bg-white/[0.03] " +
        className
      }
      aria-label="Монгол Улсын Их Хурлын сүлд"
    >
      <Image
        src="/Их_хурал_logo.png"
        alt="Монгол Улсын Их Хурал"
        fill
        sizes="64px"
        className="object-contain"
        priority
      />
    </span>
  );
}
