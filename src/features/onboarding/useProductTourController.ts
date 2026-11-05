import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { ACCOUNT_PATH } from '@/components/layout/navigation';
import { useAuth } from '@/hooks/useAuth';

interface ProductTourControllerOptions {
  isDesktop: boolean;
  setDrawerProgress: (progress: number) => void;
  setMobileMenuOpen: Dispatch<SetStateAction<boolean>>;
}

export function useProductTourController({
  isDesktop,
  setDrawerProgress,
  setMobileMenuOpen,
}: ProductTourControllerOptions) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [tourReplayRequest, setTourReplayRequest] = useState(0);
  const [tourStepIndex, setTourStepIndex] = useState<number | null>(null);

  const handleAccountMenuOpenChange = useCallback(
    (open: boolean) => {
      if (!open && tourStepIndex === 2) return;
      setAccountMenuOpen(open);
    },
    [tourStepIndex],
  );
  const replayProductTour = useCallback(() => {
    setAccountMenuOpen(false);
    setTourReplayRequest((request) => request + 1);
  }, []);
  const openAccountMenuForTour = useCallback(() => setAccountMenuOpen(true), []);
  const closeAccountMenuForTour = useCallback(() => setAccountMenuOpen(false), []);
  const navigateToAccountForTour = useCallback(() => navigate(ACCOUNT_PATH), [navigate]);
  const prepareAccountTourTarget = useCallback(() => {
    if (isDesktop) return;
    setDrawerProgress(1);
    setMobileMenuOpen(true);
  }, [isDesktop, setDrawerProgress, setMobileMenuOpen]);

  return {
    profile,
    accountMenuOpen,
    tourReplayRequest,
    tourStepIndex,
    setTourStepIndex,
    handleAccountMenuOpenChange,
    replayProductTour,
    openAccountMenuForTour,
    closeAccountMenuForTour,
    navigateToAccountForTour,
    prepareAccountTourTarget,
  };
}
