import { BiNews, BiHome, BiImage, BiCog } from 'react-icons/bi';

export const MENU_ITEMS = [
  {
    label: 'Accueil',
    path: '/',
    icon: BiHome
  },
  {
    label: 'Actualités',
    path: '/news',
    icon: BiNews
  },
  {
    label: 'Galerie',
    path: '/gallery',
    icon: BiImage
  },
  {
    label: 'Paramètres',
    path: '/settings',
    icon: BiCog
  }
]; 