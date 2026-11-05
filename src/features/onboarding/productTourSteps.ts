export type ProductTourSide = 'right' | 'below' | 'center';

export interface ProductTourStep {
  target: string | null;
  title: string;
  text: string;
  side: ProductTourSide;
  before?: () => void | Promise<void>;
}

export interface ProductTourCopy {
  welcomeTitle: string;
  welcomeText: string;
  avatarTitle: string;
  avatarText: string;
  profileTitle: string;
  profileText: string;
  preferencesTitle: string;
  preferencesText: string;
  recognitionTitle: string;
  recognitionText: string;
  finishTitle: string;
  finishText: string;
}

export interface ProductTourActions {
  prepareAccountTarget: () => void;
  openAccountMenu: () => void;
  closeAccountMenu: () => void;
  navigateToAccount: () => void | Promise<void>;
}

export function createProductTourSteps(
  copy: ProductTourCopy,
  actions: ProductTourActions,
  includeRecognition: boolean,
): readonly ProductTourStep[] {
  const steps: ProductTourStep[] = [
    { target: null, title: copy.welcomeTitle, text: copy.welcomeText, side: 'center' },
    {
      target: '[data-tour="account-trigger"]',
      title: copy.avatarTitle,
      text: copy.avatarText,
      side: 'right',
      before: actions.prepareAccountTarget,
    },
    {
      target: '[data-tour="account-profile-link"]',
      title: copy.profileTitle,
      text: copy.profileText,
      side: 'right',
      before: actions.openAccountMenu,
    },
    {
      target: '[data-tour="account-appearance"]',
      title: copy.preferencesTitle,
      text: copy.preferencesText,
      side: 'below',
      before: async () => {
        actions.closeAccountMenu();
        await actions.navigateToAccount();
      },
    },
  ];

  if (includeRecognition) {
    steps.push({
      target: '.account-recognition',
      title: copy.recognitionTitle,
      text: copy.recognitionText,
      side: 'below',
    });
  }

  steps.push({ target: null, title: copy.finishTitle, text: copy.finishText, side: 'center' });
  return steps;
}

export function getNextProductTourStep(index: number, stepCount: number): number | null {
  const nextIndex = index + 1;
  return nextIndex < stepCount ? nextIndex : null;
}
