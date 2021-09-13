import { defaultEnvironment } from './default-environment';
import { defaultFooterLinks } from './default-footer-links';
import { defaultHeaderLinks } from './default-header-links';
import { entryQueue9v9 } from './entry-queues/entry-queue-9v9';

const discordInvitation = 'https://discord.gg/UVFVfc4';

export const environment = {
  ...defaultEnvironment,
  apiUrl: 'https://api.hl.tf2pickup.pl',
  wsUrl: 'https://api.hl.tf2pickup.pl',
  headerLinks: [
    {
      name: 'discord',
      icon: '/assets/ui_icon_discord.png',
      target: discordInvitation,
      tooltip: 'Join us on discord!',
    },
    ...defaultHeaderLinks,
  ],
  footerLinks: [
    ...defaultFooterLinks,
    { name: 'discord', target: discordInvitation },
  ],
  titleSuffix: 'hl.tf2pickup.pl • Polskie Pickupy 9v9',
  entryQueue: entryQueue9v9,
};
