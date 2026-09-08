import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { FormWizard, type FormWizardStep } from "@/components/ui/FormWizard";
import { toast } from "@/lib/notify";
import {
  completeDataUpdateRecord,
  dataUpdateError,
  getDataUpdatePhotoUrl,
  removeDataUpdatePhoto,
  reviewDataUpdateIdentity,
  saveDataUpdateRecord,
  uploadDataUpdatePhoto,
} from "./api";
import { DATA_UPDATE_AUTOSAVE_DELAY_MS, DATA_UPDATE_STEP_COUNT } from "./constants";
import { AddressStep, AdditionalDataStep, ContactStep, TransportStep } from "./EditableDataSteps";
import { IdentityReviewStep } from "./IdentityReviewStep";
import { PhotoReviewStep } from "./PhotoReviewStep";
import type {
  DataUpdateCampaignDetail,
  DataUpdateEditableData,
  DataUpdateIdentity,
  DataUpdateIncident,
  DataUpdateRecord,
  IdentityReviewStatus,
} from "./types";
import {
  isDataUpdateEmailValid,
  validateDataUpdatePhoto,
  validateEditableData,
} from "./validation";

interface DataUpdateWizardProps {
  record: DataUpdateRecord;
  campaign: DataUpdateCampaignDetail;
  incidents: DataUpdateIncident[];
  online: boolean;
  onCancel: () => void;
  onCompleted: () => void;
}

function signature(data: DataUpdateEditableData, step: number, photoPath: string | null) {
  return JSON.stringify({ data, step, photoPath });
}

export function DataUpdateWizard({
  record: initialRecord,
  campaign,
  incidents,
  online,
  onCancel,
  onCompleted,
}: DataUpdateWizardProps) {
  const [record, setRecord] = useState(initialRecord);
  const [data, setData] = useState(initialRecord.data);
  const [review, setReview] = useState<IdentityReviewStatus>(initialRecord.identityReview);
  const [incidentFields, setIncidentFields] = useState<Set<keyof DataUpdateIdentity>>(
    () => new Set(incidents.map((incident) => incident.fieldName)),
  );
  const [incidentNote, setIncidentNote] = useState(incidents[0]?.note ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const objectPhotoUrlRef = useRef<string | null>(null);
  const recordRef = useRef(initialRecord);
  const dataRef = useRef(initialRecord.data);
  const photoPathRef = useRef(initialRecord.photoPath);
  const currentStepRef = useRef(Math.min(initialRecord.currentStep, DATA_UPDATE_STEP_COUNT - 1));
  const saveQueueRef = useRef<Promise<boolean>>(Promise.resolve(true));
  const queuedSignatureRef = useRef("");
  const savedSignatureRef = useRef(
    signature(initialRecord.data, currentStepRef.current, initialRecord.photoPath),
  );
  const reviewSignatureRef = useRef(
    JSON.stringify({ review: initialRecord.identityReview, incidents: incidents.map(({ fieldName, note }) => ({ fieldName, note })) }),
  );

  const updateRecord = (next: DataUpdateRecord) => {
    const merged = {
      ...next,
      assignedName: next.assignedName ?? recordRef.current.assignedName,
      campaignName: next.campaignName ?? recordRef.current.campaignName,
    };
    recordRef.current = merged;
    setRecord(merged);
  };

  useEffect(() => {
    let active = true;
    if (!record.photoPath) {
      setPhotoUrl(null);
      return () => { active = false; };
    }
    void getDataUpdatePhotoUrl(record.photoPath)
      .then((url) => {
        if (!active) return;
        if (objectPhotoUrlRef.current) {
          URL.revokeObjectURL(objectPhotoUrlRef.current);
          objectPhotoUrlRef.current = null;
        }
        setPhotoUrl(url);
      })
      .catch(() => { if (active) setNotice("No fue posible cargar la vista previa de la fotografía."); });
    return () => { active = false; };
  }, [record.photoPath]);

  useEffect(() => () => {
    if (objectPhotoUrlRef.current) URL.revokeObjectURL(objectPhotoUrlRef.current);
  }, []);

  const changeField = (field: keyof DataUpdateEditableData, value: string) => {
    setData((current) => {
      const next = { ...current, [field]: value };
      dataRef.current = next;
      return next;
    });
    setNotice(null);
  };

  const persist = (step: number): Promise<boolean> => {
    if (!online) {
      setNotice("Necesitas conexión para guardar este registro.");
      return Promise.resolve(false);
    }
    const dataSnapshot = dataRef.current;
    const photoSnapshot = photoPathRef.current;
    const nextSignature = signature(dataSnapshot, step, photoSnapshot);
    if (nextSignature === savedSignatureRef.current) return saveQueueRef.current;
    if (nextSignature === queuedSignatureRef.current) return saveQueueRef.current;
    queuedSignatureRef.current = nextSignature;
    saveQueueRef.current = saveQueueRef.current.then(async () => {
      try {
        const saved = await saveDataUpdateRecord({
          recordId: recordRef.current.id,
          version: recordRef.current.version,
          data: dataSnapshot,
          step,
          photoPath: photoSnapshot,
        });
        updateRecord(saved);
        savedSignatureRef.current = nextSignature;
        setNotice(null);
        return true;
      } catch (caught) {
        setNotice(dataUpdateError(caught));
        return false;
      } finally {
        if (queuedSignatureRef.current === nextSignature) queuedSignatureRef.current = "";
      }
    });
    return saveQueueRef.current;
  };

  useEffect(() => {
    if (!online) return;
    const timer = window.setTimeout(() => {
      void persist(currentStepRef.current);
    }, DATA_UPDATE_AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [data, online]);

  const saveIdentityReview = async (): Promise<boolean> => {
    if (review !== "confirmado" && review !== "incidencia") return false;
    const selectedIncidents = review === "incidencia"
      ? [...incidentFields].map((fieldName) => ({ fieldName, note: incidentNote.trim() }))
      : [];
    const nextSignature = JSON.stringify({ review, incidents: selectedIncidents });
    if (nextSignature === reviewSignatureRef.current) return true;
    try {
      const saved = await reviewDataUpdateIdentity({
        recordId: recordRef.current.id,
        version: recordRef.current.version,
        status: review,
        incidents: selectedIncidents,
      });
      updateRecord(saved);
      reviewSignatureRef.current = nextSignature;
      return true;
    } catch (caught) {
      setNotice(dataUpdateError(caught));
      return false;
    }
  };

  const beforeStepChange = async (currentStep: number, nextStep: number) => {
    if (!online) {
      setNotice("Necesitas conexión para continuar.");
      return false;
    }
    const queued = await saveQueueRef.current;
    if (!queued) return false;
    if (currentStep === 0 && !(await saveIdentityReview())) return false;
    const saved = await persist(nextStep);
    if (saved) currentStepRef.current = nextStep;
    return saved;
  };

  const toggleIncidentField = (field: keyof DataUpdateIdentity) => {
    setIncidentFields((current) => {
      const next = new Set(current);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  const handlePhoto = async (file: File | undefined) => {
    if (!file) return;
    const validationError = validateDataUpdatePhoto(file);
    if (validationError) {
      setNotice(validationError);
      return;
    }
    if (!online) {
      setNotice("Necesitas conexión para cargar la fotografía.");
      return;
    }
    setPhotoBusy(true);
    setNotice(null);
    const previousPath = photoPathRef.current;
    const previousUrl = photoUrl;
    let uploadedPath: string | null = null;
    try {
      if (objectPhotoUrlRef.current) URL.revokeObjectURL(objectPhotoUrlRef.current);
      const objectUrl = URL.createObjectURL(file);
      objectPhotoUrlRef.current = objectUrl;
      setPhotoUrl(objectUrl);
      uploadedPath = await uploadDataUpdatePhoto(recordRef.current, file);
      photoPathRef.current = uploadedPath;
      const saved = await persist(currentStepRef.current);
      if (!saved) throw new Error("No fue posible vincular la fotografía al registro.");
      if (previousPath && previousPath !== uploadedPath) {
        await removeDataUpdatePhoto(previousPath).catch(() => undefined);
      }
      toast.success({ title: "Fotografía guardada" });
    } catch (caught) {
      if (uploadedPath) await removeDataUpdatePhoto(uploadedPath).catch(() => undefined);
      if (objectPhotoUrlRef.current) {
        URL.revokeObjectURL(objectPhotoUrlRef.current);
        objectPhotoUrlRef.current = null;
      }
      photoPathRef.current = previousPath;
      setPhotoUrl(previousUrl);
      setNotice(dataUpdateError(caught));
    } finally {
      setPhotoBusy(false);
    }
  };

  const transportValid = campaign.transportOptions.some(
    (option) => option.route === data.route && option.stop === data.stop && option.location === data.location,
  );
  const identityValid = review === "confirmado" || (
    review === "incidencia" && incidentFields.size > 0 && Boolean(incidentNote.trim())
  );
  const contactValid = Boolean(
    data.birthState && data.civilStatus && data.email && data.mobilePhone
      && isDataUpdateEmailValid(data.email),
  );
  const addressValid = Boolean(data.emergencyContact && data.emergencyPhone && data.street && data.fullAddress && data.municipality);
  const additionalValid = Boolean(data.educationLevel && data.bloodType && data.allergies && data.locker);
  const allDataValid = validateEditableData(data).length === 0 && transportValid;

  const steps: FormWizardStep[] = useMemo(() => [
    {
      id: "identity",
      title: "Identificación",
      isValid: identityValid,
      content: (
        <IdentityReviewStep
          identity={record.identity}
          review={review}
          selectedFields={incidentFields}
          note={incidentNote}
          existingIncidents={incidents}
          onReviewChange={setReview}
          onFieldToggle={toggleIncidentField}
          onNoteChange={setIncidentNote}
        />
      ),
    },
    { id: "transport", title: "Transporte", isValid: transportValid, content: <TransportStep data={data} transportOptions={campaign.transportOptions} onChange={changeField} /> },
    { id: "contact", title: "Contacto", isValid: contactValid, content: <ContactStep data={data} civilStatuses={campaign.civilStatuses} onChange={changeField} /> },
    { id: "address", title: "Domicilio", isValid: addressValid, content: <AddressStep data={data} onChange={changeField} /> },
    { id: "additional", title: "Información adicional", isValid: additionalValid, content: <AdditionalDataStep data={data} onChange={changeField} /> },
    { id: "photo", title: "Fotografía y revisión", isValid: Boolean(photoPathRef.current) && allDataValid, content: <PhotoReviewStep identity={record.identity} data={data} photoUrl={photoUrl} photoBusy={photoBusy} onPhotoChange={(file) => void handlePhoto(file)} /> },
  ], [record.identity, review, incidentFields, incidentNote, incidents, data, campaign, photoUrl, photoBusy, identityValid, transportValid, contactValid, addressValid, additionalValid, allDataValid]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!online || !photoPathRef.current || !allDataValid) return;
    setSubmitting(true);
    setNotice(null);
    try {
      if (!(await persist(DATA_UPDATE_STEP_COUNT - 1))) return;
      await completeDataUpdateRecord(recordRef.current.id, recordRef.current.version);
      toast.success({ title: "Actualización completada" });
      onCompleted();
    } catch (caught) {
      setNotice(dataUpdateError(caught));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="data-update-wizard" onSubmit={submit} onBlur={() => void persist(currentStepRef.current)} noValidate>
      <header className="data-update-wizard__header">
        <div className="data-update-wizard__context">
          <h1>{record.identity.name}</h1>
          <span className="type-caption-up text-muted">
            Empleado {record.identity.employeeNumber}
          </span>
        </div>
        {!online && <span className="data-update-save-state" role="status">Sin conexión</span>}
      </header>
      <FormWizard
        steps={steps}
        initialStep={currentStepRef.current}
        submitLabel="Finalizar actualización"
        submittingLabel="Finalizando…"
        submitting={submitting}
        submitDisabled={!online || photoBusy || !photoPathRef.current || !allDataValid}
        onCancel={onCancel}
        onBeforeStepChange={beforeStepChange}
        notice={notice ? <p className="form-error" role="alert">{notice}</p> : null}
      />
    </form>
  );
}
