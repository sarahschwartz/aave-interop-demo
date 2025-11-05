import { GRADIENT } from '@/utils/constants';
import { styled, ToggleButton, ToggleButtonProps } from '@mui/material';

const CustomToggleButton = styled(ToggleButton)<ToggleButtonProps>(() => ({
  border: '0px',
  flex: 1,
  borderRadius: '4px',
  color: '#c1c1c1',
  
  '&.Mui-selected, &.Mui-selected:hover': {
    backgroundColor: '#FFFFFF',
    borderRadius: '4px !important',
  },

  '&.Mui-selected, &.Mui-disabled': {
    zIndex: 100,
    height: '100%',
    display: 'flex',
    justifyContent: 'center',

    'p': {
      background: GRADIENT,
      backgroundClip: 'text',
      textFillColor: 'transparent',
    },
  },
})) as typeof ToggleButton;

export default function StyledToggleButton(props: ToggleButtonProps) {
  return <CustomToggleButton {...props} />;
}
