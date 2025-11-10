import { styled, Switch, type SwitchProps } from "@mui/material";

const IOSSwitch = styled((props: SwitchProps) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  height: 20 + 6 * 2,
  width: 34 + 6 * 2,
  padding: 6,
  "& .MuiSwitch-switchBase": {
    padding: 8,
    "&.Mui-checked": {
      transform: "translateX(14px)",
      "& + .MuiSwitch-track": {
        backgroundColor: theme.palette.success.main,
        opacity: 1,
      },
    },
    "&.Mui-disabled": {
      opacity: 0.7,
    },
  },
  "& .MuiSwitch-thumb": {
    color: theme.palette.common.white,
    borderRadius: "6px",
    width: "16px",
    height: "16px",
    boxShadow: "0px 1px 1px rgba(0, 0, 0, 0.12)",
  },
  "& .MuiSwitch-track": {
    opacity: 1,
    backgroundColor: theme.palette.action.active,
    borderRadius: "8px",
  },
}));

export function StyledSwitch() {
  return <IOSSwitch disabled defaultChecked />;
}
