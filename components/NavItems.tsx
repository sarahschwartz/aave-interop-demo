import { GRADIENT } from '@/utils/constants';
import { Button, List, ListItem  } from '@mui/material';
import NextLink from 'next/link';

export const NavItems = () => {
interface Navigation {
  link: string;
  title: string;
}

const navigation: Navigation[] = [
  {
    link: '/',
    title: `Dashboard`,
  },
  {
    link: '/',
    title: `Markets`,
  },
  {
    link: '/',
    title: `Governance`,
  },
  {
    link: '/',
    title: `Faucet`,
  },
  {
    link: '/',
    title: `Savings`,
  },
  {
    link: '/',
    title: `Staking`,
  },
  {
    link: '/',
    title: `More`,
  },
];

  return (
    <List
      sx={{
        display: { xs: 'none', sm: 'none', md: 'flex' },
        justifyContent: 'center',
        flexDirection: 'row',
      }}
      disablePadding
    >
      {navigation
        .map((item, index) => (
          <ListItem
            sx={{
              width: { xs: '100%', md: 'unset' },
              mr: { xs: 0, md: 2 },
            }}
            disablePadding
            key={index}
          >
              <Button
                component={NextLink}
                href={item.link}
                sx={{
                  color: '#F1F1F3',
                  p: '6px 8px',
                  textTransform: 'none',
                  position: 'relative',
                  '.active&:after, &:hover&:after': {
                    transform: 'scaleX(1)',
                    transformOrigin: 'bottom left',
                  },
                  '&:after': {
                    content: "''",
                    position: 'absolute',
                    width: '100%',
                    transform: 'scaleX(0)',
                    height: '2px',
                    bottom: '-4px',
                    left: '0',
                    background: GRADIENT,
                    transformOrigin: 'bottom right',
                    transition: 'transform 0.25s ease-out',
                  },
                }}
              >
                {item.title}
              </Button>
          </ListItem>
        ))}

      <ListItem
        sx={{
          width: { xs: '100%', md: 'unset' },
          mr: { xs: 0, md: 2 },
        }}
        disablePadding
      >
        
      </ListItem>
    </List>
  );
};
