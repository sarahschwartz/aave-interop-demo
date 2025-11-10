import { Skeleton } from "@mui/material";

const SKELETON_STYLE = { bgcolor: "#444756" };

export function SkeletonAsset() {
  return (
    <div className="flex gap-2">
      <Skeleton sx={SKELETON_STYLE} variant="circular" width={35} height={35} />
      <Skeleton sx={SKELETON_STYLE} width={35} height={35} />
    </div>
  );
}

export function SkeletonBasic() {
  return <Skeleton sx={SKELETON_STYLE} width={60} height={35} />;
}

export function SkeletonButtons() {
  return (
    <div className="flex gap-2">
      <Skeleton sx={SKELETON_STYLE} width={60} height={55} />
      <Skeleton sx={SKELETON_STYLE} width={60} height={55} />
    </div>
  );
}
