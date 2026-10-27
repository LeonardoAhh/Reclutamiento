import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Camera, CircleAlert, CircleCheckBig, X } from 'lucide-react';
import type { Worker } from 'tesseract.js';
import { PageHeading } from '@/components/layout/PageHeading';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Badge } from '@/components/ui/Badge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRutas } from '@/hooks/useRutas';
import { readPrintedEmployeeNumber } from './route-scanner-ocr';
import './RouteScannerPage.css';

type ScanState = 'idle' | 'starting' | 'camera' | 'reading';

const copy = {
  es: {
    title: 'Escáner', back: 'Volver a seleccionar ruta', route: 'Ruta seleccionada',
    intro: 'Enfoca el número impreso debajo de las barras.',
    openCamera: 'Abrir cámara', retakePhoto: 'Tomar otra foto', takePhoto: 'Tomar foto', closeCamera: 'Cerrar cámara',
    number: 'Número de empleado', verify: 'Verificar',
    reading: 'Leyendo el número de la credencial…', loading: 'Cargando asignaciones de rutas…',
    noRoute: 'Selecciona una ruta para verificar la credencial.',
    noNumber: 'No pudimos leer el número impreso. Toma otra foto o escríbelo.',
    invalidNumber: 'Escribe entre 1 y 5 dígitos.',
    cameraError: 'No pudimos abrir la cámara. Revisa el permiso o escribe el número.',
    photoError: 'No pudimos procesar la foto. Vuelve a intentarlo o escribe el número.',
    loadError: 'No se pudieron cargar las asignaciones actuales. Inténtalo más tarde.',
    found: 'Corresponde a esta ruta', different: 'Corresponde a otra ruta',
    unknown: 'No aparece en el listado', duplicate: 'Asignación por confirmar',
    unknownDescription: 'No se puede confirmar su ruta con el listado actual.',
    duplicateDescription: 'Aparece en varias rutas; verifica la asignación.',
    numberRead: 'Confirma el número leído antes de verificar.',
    assignedRoute: 'Ruta registrada', photoAlt: 'Foto de la credencial seleccionada',
  },
  en: {
    title: 'Scanner', back: 'Back to route selection', route: 'Selected route',
    intro: 'Focus on the number printed below the bars.',
    openCamera: 'Open camera', retakePhoto: 'Take another photo', takePhoto: 'Take photo', closeCamera: 'Close camera',
    number: 'Employee number', verify: 'Verify',
    reading: 'Reading the number on the ID card…', loading: 'Loading route assignments…',
    noRoute: 'Select a route to verify the ID card.',
    noNumber: 'We could not read the printed number. Take another photo or enter it.',
    invalidNumber: 'Enter 1 to 5 digits.',
    cameraError: 'We could not open the camera. Check permission or enter the number.',
    photoError: 'We could not process the photo. Try again or enter the number.',
    loadError: 'Current route assignments could not be loaded. Try again later.',
    found: 'Assigned to this route', different: 'Assigned to another route',
    unknown: 'Not on the current list', duplicate: 'Assignment needs review',
    unknownDescription: 'Its route cannot be confirmed from the current list.',
    duplicateDescription: 'It appears on multiple routes; check the assignment.',
    numberRead: 'Confirm the number read before verifying.',
    assignedRoute: 'Registered route', photoAlt: 'Selected ID card photo',
  },
} as const;

export function RouteScannerPage() {
  const { language } = useLanguage();
  const t = copy[language];
  const [routeName, setRouteName] = useState('');
  const { rutas, loading, errorMsg } = useRutas({ currentOnly: true });
  const route = rutas.find(item => item.nombreRuta === routeName);
  const routeOptions = useMemo(() => rutas.map(item => ({ value: item.nombreRuta, label: item.nombreRuta })), [rutas]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const numberInputRef = useRef<HTMLInputElement>(null);
  const keyboardAnchorRef = useRef<{ top: number; viewportHeight: number } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const photoUrlRef = useRef<string | null>(null);
  const stepRef = useRef(0);
  const mountedRef = useRef(true);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [number, setNumber] = useState('');
  const [verifiedNumber, setVerifiedNumber] = useState<string | null>(null);
  const [numberRead, setNumberRead] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      streamRef.current?.getTracks().forEach(track => track.stop());
      void workerRef.current?.terminate();
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    };
  }, []);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    let frame = 0;
    const restorePositionOnKeyboardOpen = () => {
      const anchor = keyboardAnchorRef.current;
      if (!anchor || document.activeElement !== numberInputRef.current || viewport.height >= anchor.viewportHeight) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => window.scrollTo({ top: anchor.top, behavior: 'instant' }));
    };
    viewport.addEventListener('resize', restorePositionOnKeyboardOpen);
    return () => {
      viewport.removeEventListener('resize', restorePositionOnKeyboardOpen);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const matches = useMemo(() => {
    if (!verifiedNumber) return [];
    const normalized = verifiedNumber.replace(/^0+(?=\d)/, '');
    return rutas.flatMap(item => item.empleados
      .filter(employee => employee.numeroEmpleado.trim().replace(/^0+(?=\d)/, '') === normalized)
      .map(employee => ({ employee, routeName: item.nombreRuta })));
  }, [rutas, verifiedNumber]);

  const result = verifiedNumber && !loading && !errorMsg && route
    ? matches.length === 0 ? 'unknown'
      : matches.length > 1 ? 'duplicate'
        : matches[0].routeName === route.nombreRuta ? 'found' : 'different'
    : null;

  function stopCamera() {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanState('idle');
  }

  function returnToRouteSelection() {
    stepRef.current += 1;
    stopCamera();
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    photoUrlRef.current = null;
    setPhotoUrl(null);
    setNumber('');
    setVerifiedNumber(null);
    setNumberRead(false);
    setNotice(null);
    setRouteName('');
  }

  async function openCamera() {
    const step = stepRef.current;
    setNotice(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setNotice(t.cameraError);
      return;
    }
    setScanState('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      if (!mountedRef.current || step !== stepRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = stream;
      setVerifiedNumber(null);
      setNumberRead(false);
      setNumber('');
      if (photoUrlRef.current) {
        URL.revokeObjectURL(photoUrlRef.current);
        photoUrlRef.current = null;
        setPhotoUrl(null);
      }
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      if (step === stepRef.current) setScanState('camera');
    } catch {
      if (step !== stepRef.current) return;
      stopCamera();
      setNotice(t.cameraError);
    }
  }

  async function readPhoto(photo: Blob) {
    const step = stepRef.current;
    setNotice(null);
    setVerifiedNumber(null);
    setNumberRead(false);
    setNumber('');
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    photoUrlRef.current = URL.createObjectURL(photo);
    setPhotoUrl(photoUrlRef.current);
    setScanState('reading');
    try {
      if (!workerRef.current) {
        const { createWorker, PSM } = await import('tesseract.js');
        const worker = await createWorker('eng');
        try {
          await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT, tessedit_char_whitelist: '0123456789*' });
        } catch (error) {
          await worker.terminate();
          throw error;
        }
        if (!mountedRef.current) {
          await worker.terminate();
          return;
        }
        workerRef.current = worker;
      }
      if (step !== stepRef.current) return;
      const extracted = await readPrintedEmployeeNumber(photo, workerRef.current);
      if (!mountedRef.current || step !== stepRef.current) return;
      if (extracted) {
        setNumber(extracted);
        setNumberRead(true);
      } else {
        setNotice(t.noNumber);
      }
    } catch {
      if (mountedRef.current && step === stepRef.current) setNotice(t.photoError);
    } finally {
      if (mountedRef.current && step === stepRef.current) setScanState('idle');
    }
  }

  async function takePhoto() {
    const step = stepRef.current;
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const photo = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg'));
    if (step !== stepRef.current) return;
    stopCamera();
    if (photo) void readPhoto(photo);
    else setNotice(t.photoError);
  }

  function verifyNumber() {
    if (!route || loading || errorMsg || scanState !== 'idle') return;
    const value = number.trim();
    setNumberRead(false);
    if (!/^\d{1,5}$/.test(value)) {
      setVerifiedNumber(null);
      setNotice(t.invalidNumber);
      return;
    }
    setNotice(null);
    setVerifiedNumber(value);
  }

  return (
    <main className="route-scanner-page container" aria-labelledby="route-scanner-title">
      <PageHeading id="route-scanner-title" className="app-page-title">
        {route ? (
          <button type="button" className="route-scanner-page__title-link" onClick={returnToRouteSelection} aria-label={`${t.title}. ${t.back}`}>
            <ArrowLeft aria-hidden="true" />
            <span>{t.title}</span>
          </button>
        ) : t.title}
      </PageHeading>
      <section className="route-scanner-page__card" aria-label={t.title}>
        {route ? <>
        <div className="route-scanner-page__route">
          <p className="route-scanner-page__eyebrow">{t.route}</p>
          <h2>{route.nombreRuta}</h2>
        </div>
        <div className="route-scanner-page__verification">
          <label htmlFor="route-scanner-number">{t.number}</label>
          <div className="route-scanner-page__number-row">
            <input ref={numberInputRef} id="route-scanner-number" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={5} enterKeyHint="done" autoComplete="off" value={number}
              onPointerDown={() => { keyboardAnchorRef.current = { top: window.scrollY, viewportHeight: window.visualViewport?.height ?? window.innerHeight }; }}
              onFocus={() => { keyboardAnchorRef.current ??= { top: window.scrollY, viewportHeight: window.visualViewport?.height ?? window.innerHeight }; }}
              onBlur={() => { keyboardAnchorRef.current = null; }}
              onChange={event => { setNumber(event.target.value.replace(/\D/g, '').slice(0, 5)); setVerifiedNumber(null); setNumberRead(false); }}
              onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); verifyNumber(); } }} disabled={scanState !== 'idle' || Boolean(errorMsg)} />
            <button type="button" className="btn-primary" onClick={verifyNumber}
              disabled={scanState !== 'idle' || !route || loading || Boolean(errorMsg)}>{t.verify}</button>
            <button type="button" className="btn-icon route-scanner-page__open-camera" onClick={openCamera}
              disabled={scanState !== 'idle'} aria-label={photoUrl ? t.retakePhoto : t.openCamera}>
              <Camera aria-hidden="true" />
            </button>
          </div>
        </div>
        {numberRead && <p role="status">{t.numberRead}</p>}
        {result && <div className="route-scanner-page__match" role="status">
          <Badge className="route-scanner-page__match-status" variant={result === 'found' ? 'success' : result === 'unknown' ? 'error' : 'amber'}>
            {result === 'found' ? <CircleCheckBig aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
            {t[result]}
          </Badge>
          {matches.length === 1 && <p className="route-scanner-page__match-identity"><span>{matches[0].employee.numeroEmpleado}</span><span aria-hidden="true">·</span><span>{matches[0].employee.nombre}</span></p>}
          {result === 'different' && <p className="route-scanner-page__match-route"><span>{t.assignedRoute}:</span><strong>{matches[0].routeName}</strong></p>}
          {result === 'unknown' && <p>{t.unknownDescription}</p>}
          {result === 'duplicate' && <p>{t.duplicateDescription}</p>}
        </div>}
        {!photoUrl && scanState === 'idle' && !result && <p className="route-scanner-page__intro">{t.intro}</p>}
        <div className={`route-scanner-page__preview${scanState === 'camera' || scanState === 'starting' ? ' route-scanner-page__preview--camera' : ''}`}
          hidden={!photoUrl && scanState !== 'camera' && scanState !== 'starting'}>
          <video ref={videoRef} autoPlay muted playsInline hidden={scanState !== 'camera' && scanState !== 'starting'} aria-label={t.openCamera} />
          {photoUrl && scanState !== 'camera' && scanState !== 'starting' && <img src={photoUrl} alt={t.photoAlt} />}
          {scanState === 'camera' && (
            <div className="route-scanner-page__camera-controls">
              <button type="button" className="btn-icon route-scanner-page__close-camera" onClick={stopCamera} aria-label={t.closeCamera}>
                <X aria-hidden="true" />
              </button>
              <button type="button" className="btn-icon route-scanner-page__shutter" onClick={takePhoto} aria-label={t.takePhoto}>
                <Camera aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
        {scanState === 'starting' && <p role="status">{t.openCamera}…</p>}
        {scanState === 'reading' && <p role="status">{t.reading}</p>}
        {notice && <p role="alert" className="route-scanner-page__notice">{notice}</p>}
        </> : loading ? (
          <LoadingSkeleton label={t.loading} className="route-scanner-page__loading">
            <span className="loading-skeleton__bone route-scanner-page__skeleton-label" aria-hidden="true" />
            <span className="loading-skeleton__bone route-scanner-page__skeleton-select" aria-hidden="true" />
          </LoadingSkeleton>
        ) : <>
          <div className="route-scanner-page__route">
            <p className="route-scanner-page__eyebrow">{t.route}</p>
            <CustomSelect
              value=""
              aria-label={t.route}
              placeholder={t.noRoute}
              showPlaceholderOption={false}
              options={routeOptions}
              disabled={Boolean(errorMsg)}
              onChange={setRouteName}
            />
          </div>
          {errorMsg && <p role="alert">{t.loadError}</p>}
        </>}
      </section>
    </main>
  );
}
