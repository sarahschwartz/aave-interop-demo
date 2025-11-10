import Image from "next/image";

export default function Header() {
  return (
    <div className="flex gap-2 mx-8">
      <Image src="ethereum.svg" alt="Ethereum logo" width={32} height={32} />
      <div className="text-white font-bold text-3xl">
        Ethereum Market <span className="text-lg">(via ZKsync)</span>
      </div>
    </div>
  );
}
