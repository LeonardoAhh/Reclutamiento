import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { useLocation } from 'react-router-dom';
import { ProductTourOverlay } from '@/components/ui/ProductTourOverlay';
import { ProductTourPopover } from '@/components/ui/ProductTourPopover';
import { useLanguage } from '@/contexts/LanguageContext';
import { accountCopy } from '@/pages/account-translations';
import { ACCOUNT_PATH } from '@/components/layout/navigation';
import {
  createProductTourSteps,
  getNextProductTourStep,
  type ProductTourStep,
} from '@/features/onboarding/productTourSteps';
import { measureTourTarget, waitForTarget, type TargetBounds } from '@/features/onboarding/productTourUtils';
import { useProductTourKeyboard } from '@/features/onboarding/useProductTourKeyboard';
import { toast, toastStore } from '@/lib/notify';

interface ProductTourProps {
  profileId: string;
  showRecognition: boolean;
  startupOverlaysReady: boolean;
  replayRequest: number;
  onStepChange: (index: number | null) => void;
  onOpenAccountMenu: () => void;
  onCloseAccountMenu: () => void;
  onPrepareAccountTarget: () => void;
  onNavigateToAccount: () => void;
}

export function ProductTour({
  profileId,
  showRecognition,
  startupOverlaysReady,
  replayRequest,
  onStepChange,
  onOpenAccountMenu,
  onCloseAccountMenu,
  onPrepareAccountTarget,
  onNavigateToAccount,
}: ProductTourProps) {
  const { language } = useLanguage();
  const location = useLocation();
  const activeNotices = useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot, toastStore.getSnapshot);
  const copy = accountCopy(language);
  const steps = useMemo(
    () =>
      createProductTourSteps(
        copy.productTour,
        {
          prepareAccountTarget: onPrepareAccountTarget,
          openAccountMenu: onOpenAccountMenu,
          closeAccountMenu: onCloseAccountMenu,
          navigateToAccount: onNavigateToAccount,
        },
        showRecognition,
      ),
    [
      copy.productTour,
      onCloseAccountMenu,
      onNavigateToAccount,
      onOpenAccountMenu,
      onPrepareAccountTarget,
      showRecognition,
    ],
  );
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [targetBounds, setTargetBounds] = useState<TargetBounds | null>(null);
  const [storageError, setStorageError] = useState(false);
  const sequenceRef = useRef(0);
  const stepIndexRef = useRef<number | null>(null);
  const waitControllerRef = useRef<AbortController | null>(null);
  const previousReplayRequestRef = useRef(replayRequest);
  const previousPathRef = useRef(location.pathname);
  const autoStartProfileRef = useRef<string | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const step = stepIndex === null ? null : steps[stepIndex];
  const storageKey = `reclutamiento_product_tour_${profileId}`;
  const startTourRef = useRef<(index?: number, storageFailed?: boolean) => void>(() => {});

  const saveStatus = useCallback(
    (status: 'completed' | 'dismissed') => {
      try {
        window.localStorage.setItem(storageKey, status);
      } catch {
        setStorageError(true);
        toast.error({ title: copy.productTour.storageFailed });
      }
    },
    [copy.productTour.storageFailed, storageKey],
  );

  const activateStep = useCallback(
    async function activateStep(nextIndex: number) {
      if (nextIndex < 0 || nextIndex >= steps.length) return;
      const sequence = ++sequenceRef.current;
      waitControllerRef.current?.abort();
      const previousIndex = stepIndexRef.current;
      if (previousIndex === 2 && nextIndex !== 2) onCloseAccountMenu();

      stepIndexRef.current = nextIndex;
      setStepIndex(nextIndex);
      onStepChange(nextIndex);
      setTarget(null);
      setTargetBounds(null);
      const nextStep: ProductTourStep = steps[nextIndex];
      await nextStep.before?.();
      if (sequence !== sequenceRef.current) return;

      if (nextStep.target) {
        const controller = new AbortController();
        waitControllerRef.current = controller;
        const nextTarget = await waitForTarget(nextStep.target, controller.signal);
        if (sequence !== sequenceRef.current) return;
        if (!nextTarget) {
          waitControllerRef.current = null;
          void activateStep(nextIndex + 1);
          return;
        }

        const initialBounds = nextTarget.getBoundingClientRect();
        if (
          initialBounds.top < 0 ||
          initialBounds.left < 0 ||
          initialBounds.bottom > window.innerHeight ||
          initialBounds.right > window.innerWidth
        ) {
          nextTarget.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
        }
        setTarget(nextTarget);
        setTargetBounds(measureTourTarget(nextTarget));
      }

      setIsOpen(true);
    },
    [onCloseAccountMenu, onStepChange, steps],
  );

  const startTour = useCallback(
    (index = 0, storageFailed = false) => {
      autoStartProfileRef.current = profileId;
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setStorageError(storageFailed);
      void activateStep(index);
    },
    [activateStep, profileId],
  );

  useEffect(() => {
    startTourRef.current = startTour;
  }, [startTour]);

  const closeTour = useCallback(
    (status: 'completed' | 'dismissed') => {
      sequenceRef.current += 1;
      waitControllerRef.current?.abort();
      waitControllerRef.current = null;
      onCloseAccountMenu();
      setIsOpen(false);
      stepIndexRef.current = null;
      setStepIndex(null);
      setTarget(null);
      setTargetBounds(null);
      onStepChange(null);
      saveStatus(status);
      window.requestAnimationFrame(() => {
        const returnTarget =
          returnFocusRef.current?.isConnected && returnFocusRef.current !== document.body
            ? returnFocusRef.current
            : document.querySelector<HTMLElement>('[data-tour="account-trigger"]');
        returnTarget?.focus({ preventScroll: true });
      });
    },
    [onCloseAccountMenu, onStepChange, saveStatus],
  );

  const goForward = useCallback(() => {
    if (stepIndex === null) return;
    const nextIndex = getNextProductTourStep(stepIndex, steps.length);
    if (nextIndex === null) {
      closeTour('completed');
      return;
    }
    void activateStep(nextIndex);
  }, [activateStep, closeTour, stepIndex, steps.length]);

  const goBack = useCallback(() => {
    if (stepIndex !== null && stepIndex > 0) void activateStep(stepIndex - 1);
  }, [activateStep, stepIndex]);

  useProductTourKeyboard({
    isOpen,
    dialogRef,
    target,
    onClose: () => closeTour('dismissed'),
    onNext: goForward,
    onBack: goBack,
  });

  useEffect(() => {
    sequenceRef.current += 1;
    waitControllerRef.current?.abort();
    waitControllerRef.current = null;
    onCloseAccountMenu();
    setIsOpen(false);
    stepIndexRef.current = null;
    setStepIndex(null);
    setTarget(null);
    onStepChange(null);
    autoStartProfileRef.current = null;
  }, [onCloseAccountMenu, onStepChange, profileId]);

  useEffect(() => {
    if (!profileId || autoStartProfileRef.current === profileId) return;
    let storageFailed = false;
    try {
      const status = window.localStorage.getItem(storageKey);
      if (status === 'completed' || status === 'dismissed') {
        autoStartProfileRef.current = profileId;
        return;
      }
    } catch {
      storageFailed = true;
    }
    if (!startupOverlaysReady || activeNotices.length > 0) return;
    const frame = window.requestAnimationFrame(() => {
      if (toastStore.getSnapshot().length > 0) return;
      startTourRef.current(0, storageFailed);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeNotices.length, profileId, startupOverlaysReady, storageKey]);

  useEffect(() => {
    if (previousReplayRequestRef.current === replayRequest) return;
    previousReplayRequestRef.current = replayRequest;
    if (profileId) startTour();
  }, [profileId, replayRequest, startTour]);

  useEffect(() => {
    if (previousPathRef.current === location.pathname) return;
    previousPathRef.current = location.pathname;
    if (stepIndex === 2 && location.pathname === ACCOUNT_PATH) void activateStep(3);
  }, [activateStep, location.pathname, stepIndex]);

  useEffect(() => {
    return () => {
      sequenceRef.current += 1;
      waitControllerRef.current?.abort();
      onCloseAccountMenu();
    };
  }, [onCloseAccountMenu]);

  useEffect(() => {
    if (!isOpen || !target) return;
    const updateBounds = () => setTargetBounds(measureTourTarget(target));
    const observer = new ResizeObserver(updateBounds);
    observer.observe(target);
    window.addEventListener('resize', updateBounds);
    document.addEventListener('scroll', updateBounds, true);
    updateBounds();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateBounds);
      document.removeEventListener('scroll', updateBounds, true);
    };
  }, [isOpen, target]);

  useEffect(() => {
    if (!isOpen || stepIndex === null || (step?.target && !target)) return;
    if (stepIndex === 2) target?.focus({ preventScroll: true });
    else dialogRef.current?.focus({ preventScroll: true });
  }, [isOpen, step, stepIndex, target]);

  const anchorStyle: CSSProperties = targetBounds
    ? {
        position: 'fixed',
        left: targetBounds.left,
        top: targetBounds.top,
        width: targetBounds.width,
        height: targetBounds.height,
        pointerEvents: 'none',
      }
    : {
        position: 'fixed',
        left: '50%',
        top: '50%',
        width: 0,
        height: 0,
        pointerEvents: 'none',
      };
  if (!isOpen || stepIndex === null || !step) return null;

  return (
    <>
      <ProductTourOverlay bounds={targetBounds} />
      <ProductTourPopover
        key={`${stepIndex}-${targetBounds ? 'target' : 'waiting'}`}
        step={step}
        stepIndex={stepIndex}
        stepCount={steps.length}
        storageError={storageError}
        copy={copy.productTour}
        anchorStyle={anchorStyle}
        dialogRef={dialogRef}
        onClose={() => closeTour('dismissed')}
        onBack={goBack}
        onNext={goForward}
      />
    </>
  );
}
