import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
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
import {
  DATA_UPDATE_AUTOSAVE_DELAY_MS,
  DATA_UPDATE_OTHER_RELATIONSHIP,
  DATA_UPDATE_STEP_COUNT,
  EMERGENCY_RELATIONSHIPS,
} from "./constants";
import { AddressStep, AdditionalDataStep, ContactStep, TransportStep } from "./EditableDataSteps";
import { IdentityReviewStep } from "./IdentityReviewStep";
import { PhotoStep, ReviewStep } from "./PhotoReviewStep";
import type {
  DataUpdateCampaignDetail,
  DataUpdateEditableData,
  DataUpdateIdentity,
  DataUpdateIncident,
  DataUpdateRecord,
  IdentityReviewStatus,
} from "./types";
import {
  getEditableDataErrors,
  isDataUpdateEmailValid,
  isDataUpdatePhoneValid,
  validateDataUpdatePhoto,
  validateEditableData,
} from "./validation";

type SaveState = "saved" | "pending" | "saving" | "error";

function initialRelationshipState(value: string) {
  const normalized = value.trim().toLocaleUpperCase("es-MX");
  const standard = EMERGENCY_RELATIONSHIPS.find(
    (option) => option !== DATA_UPDATE_OTHER_RELATIONSHIP && option === normalized,
  );
  if (standard) return { choice: standard, other: "" };
  if (!value.trim()) return { choice: "", other: "" };
  return {
    choice: DATA_UPDATE_OTHER_RELATIONSHIP,
    other: normalized === DATA_UPDATE_OTHER_RELATIONSHIP ? "" : value,
  };
}

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
  const initialRelationship = initialRelationshipState(initialRecord.data.emergencyRelationship);
  const [record, setRecord] = useState(initialRecord);
  const [data, setData] = useState(initialRecord.data);
  const [review, setReview] = useState<IdentityReviewStatus>(initialRecord.identityReview);
  const [incidentFields, setIncidentFields] = useState<Set<keyof DataUpdateIdentity>>(
    () => new Set(incidents.map((incident) => incident.fieldName)),
  );
  const [incidentNote, setIncidentNote] = useState(incidents[0]?.note ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoStatus, setPhotoStatus] = useState<string | null>(null);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [retryPhotoFile, setRetryPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [revealedErrorSteps, setRevealedErrorSteps] = useState<Set<number>>(() => new Set());
  const [relationshipChoice, setRelationshipChoice] = useState(initialRelationship.choice);
  const [relationshipOther, setRelationshipOther] = useState(initialRelationship.other);
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
    setSaveState("pending");
    setNotice(null);
  };

  const persist = (step: number): Promise<boolean> => {
    if (!online) {
      setSaveState("pending");
      setNotice("Necesitas conexión para guardar este registro.");
      return Promise.resolve(false);
    }
    const dataSnapshot = dataRef.current;
    const photoSnapshot = photoPathRef.current;
    const nextSignature = signature(dataSnapshot, step, photoSnapshot);
    if (nextSignature === savedSignatureRef.current) return saveQueueRef.current;
    if (nextSignature === queuedSignatureRef.current) return saveQueueRef.current;
    queuedSignatureRef.current = nextSignature;
    setSaveState("saving");
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
        setSaveState("saved");
        setNotice(null);
        return true;
      } catch (caught) {
        setSaveState("error");
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
    setSaveState("saving");
    try {
      const saved = await reviewDataUpdateIdentity({
        recordId: recordRef.current.id,
        version: recordRef.current.version,
        status: review,
        incidents: selectedIncidents,
      });
      updateRecord(saved);
      reviewSignatureRef.current = nextSignature;
      setSaveState("saved");
      return true;
    } catch (caught) {
      setSaveState("error");
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
    setSaveState("pending");
  };

  const showStepErrors = (step: number, message: string) => {
    setRevealedErrorSteps((current) => new Set(current).add(step));
    setNotice(message);
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(".form-wizard__body [aria-invalid='true']")?.focus();
    });
  };

  const changeRelationshipChoice = (value: string) => {
    setRelationshipChoice(value);
    changeField(
      "emergencyRelationship",
      value === DATA_UPDATE_OTHER_RELATIONSHIP ? relationshipOther : value,
    );
  };

  const changeRelationshipOther = (value: string) => {
    setRelationshipOther(value);
    changeField("emergencyRelationship", value);
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
    setPhotoStatus("Preparando fotografía…");
    setRetryPhotoFile(null);
    setNotice(null);
    const previousPath = photoPathRef.current;
    const previousUrl = photoUrl;
    let uploadedPath: string | null = null;
    try {
      if (objectPhotoUrlRef.current) URL.revokeObjectURL(objectPhotoUrlRef.current);
      const objectUrl = URL.createObjectURL(file);
      objectPhotoUrlRef.current = objectUrl;
      setPhotoUrl(objectUrl);
      setPhotoStatus("Subiendo fotografía…");
      uploadedPath = await uploadDataUpdatePhoto(recordRef.current, file);
      photoPathRef.current = uploadedPath;
      setPhotoStatus("Guardando fotografía…");
      const saved = await persist(currentStepRef.current);
      if (!saved) throw new Error("No fue posible vincular la fotografía al registro.");
      if (previousPath && previousPath !== uploadedPath) {
        await removeDataUpdatePhoto(previousPath).catch(() => undefined);
      }
      setPhotoStatus("Fotografía guardada.");
      toast.success({ title: "Fotografía guardada" });
    } catch (caught) {
      if (uploadedPath) await removeDataUpdatePhoto(uploadedPath).catch(() => undefined);
      if (objectPhotoUrlRef.current) {
        URL.revokeObjectURL(objectPhotoUrlRef.current);
        objectPhotoUrlRef.current = null;
      }
      photoPathRef.current = previousPath;
      setPhotoUrl(previousUrl);
      setPhotoStatus(null);
      setRetryPhotoFile(file);
      setNotice(dataUpdateError(caught));
    } finally {
      setPhotoBusy(false);
    }
  };

  const requestPhoto = (file: File | undefined) => {
    if (!file) return;
    const validationError = validateDataUpdatePhoto(file);
    if (validationError) {
      setNotice(validationError);
      return;
    }
    if (photoPathRef.current) {
      setPendingPhotoFile(file);
      return;
    }
    void handlePhoto(file);
  };

  const transportValid = campaign.transportOptions.some(
    (option) => option.route === data.route && option.stop === data.stop && option.location === data.location,
  );
  const identityValid = review === "confirmado" || (
    review === "incidencia" && incidentFields.size > 0 && Boolean(incidentNote.trim())
  );
  const contactValid = Boolean(
    data.birthState && data.civilStatus && data.email && data.mobilePhone
      && isDataUpdateEmailValid(data.email) && isDataUpdatePhoneValid(data.mobilePhone),
  );
  const addressValid = Boolean(
    data.emergencyContact && data.emergencyRelationship && data.emergencyPhone
      && data.street && data.fullAddress && data.municipality
      && isDataUpdatePhoneValid(data.emergencyPhone),
  );
  const additionalValid = Boolean(data.educationLevel && data.bloodType && data.allergies && data.locker);
  const fieldErrors = getEditableDataErrors(data);
  const allDataValid = validateEditableData(data).length === 0 && transportValid;
  const saveLabel = !online
    ? saveState === "pending" ? "Sin conexión · cambios pendientes" : "Sin conexión"
    : saveState === "saving"
      ? "Guardando…"
      : saveState === "pending"
        ? "Cambios pendientes"
        : saveState === "error"
          ? "No se pudo guardar"
          : "Guardado";
  const visibleErrors = (step: number) => revealedErrorSteps.has(step) ? fieldErrors : undefined;
  const transportErrors = revealedErrorSteps.has(1)
    ? {
        ...fieldErrors,
        ...(!transportValid && data.route && data.stop && data.location
          ? { location: "Selecciona una combinación válida de ruta, parada y ubicación." }
          : {}),
      }
    : undefined;

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
          onReviewChange={(value) => {
            setReview(value);
            setSaveState("pending");
            setNotice(null);
          }}
          onFieldToggle={toggleIncidentField}
          onNoteChange={(value) => {
            setIncidentNote(value);
            setSaveState("pending");
            setNotice(null);
          }}
        />
      ),
      onInvalid: () => {
        setNotice("Confirma la identificación o registra los datos incorrectos para continuar.");
        window.requestAnimationFrame(() => {
          document.querySelector<HTMLInputElement>("input[name='identity-review']")?.focus();
        });
      },
    },
    {
      id: "transport",
      title: "Transporte",
      isValid: transportValid,
      onInvalid: () => showStepErrors(1, "Revisa la selección de transporte para continuar."),
      content: <TransportStep data={data} transportOptions={campaign.transportOptions} onChange={changeField} errors={transportErrors} />,
    },
    {
      id: "contact",
      title: "Contacto",
      isValid: contactValid,
      onInvalid: () => showStepErrors(2, "Revisa los datos de contacto para continuar."),
      content: <ContactStep data={data} civilStatuses={campaign.civilStatuses} onChange={changeField} errors={visibleErrors(2)} />,
    },
    {
      id: "address",
      title: "Domicilio",
      isValid: addressValid,
      onInvalid: () => showStepErrors(3, "Completa los datos de emergencia y domicilio para continuar."),
      content: (
        <AddressStep
          data={data}
          onChange={changeField}
          errors={visibleErrors(3)}
          relationshipChoice={relationshipChoice}
          relationshipOther={relationshipOther}
          onRelationshipChoiceChange={changeRelationshipChoice}
          onRelationshipOtherChange={changeRelationshipOther}
        />
      ),
    },
    {
      id: "additional",
      title: "Información adicional",
      isValid: additionalValid,
      onInvalid: () => showStepErrors(4, "Completa la información adicional para continuar."),
      content: <AdditionalDataStep data={data} onChange={changeField} errors={visibleErrors(4)} />,
    },
    {
      id: "photo",
      title: "Fotografía",
      isValid: Boolean(photoPathRef.current),
      onInvalid: () => {
        setNotice("Agrega una fotografía para continuar.");
        window.requestAnimationFrame(() => {
          document.querySelector<HTMLInputElement>(".data-update-photo input[type='file']")?.focus();
        });
      },
      content: (
        <PhotoStep
          identity={record.identity}
          photoUrl={photoUrl}
          photoBusy={photoBusy}
          photoStatus={photoStatus}
          canRetry={Boolean(retryPhotoFile)}
          onPhotoChange={requestPhoto}
          onRetry={() => { if (retryPhotoFile) void handlePhoto(retryPhotoFile); }}
        />
      ),
    },
    {
      id: "review",
      title: "Revisión",
      isValid: Boolean(photoPathRef.current) && allDataValid,
      content: (goToStep) => <ReviewStep data={data} onEditStep={goToStep} />,
    },
  ], [record.identity, review, incidentFields, incidentNote, incidents, data, campaign, photoUrl, photoBusy, photoStatus, retryPhotoFile, relationshipChoice, relationshipOther, identityValid, transportValid, contactValid, addressValid, additionalValid, allDataValid, revealedErrorSteps, online]);

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
        <div className="data-update-save-actions">
          <span className="data-update-save-state" role="status" aria-live="polite">{saveLabel}</span>
          {online && saveState === "error" && (
            <button type="button" className="btn-secondary btn-sm" onClick={() => void persist(currentStepRef.current)}>
              Reintentar
            </button>
          )}
        </div>
      </header>
      <FormWizard
        steps={steps}
        initialStep={currentStepRef.current}
        submitLabel="Actualizar"
        submittingLabel="Actualizando..."
        submitting={submitting}
        submitDisabled={!online || photoBusy || !photoPathRef.current || !allDataValid}
        onCancel={onCancel}
        onBeforeStepChange={beforeStepChange}
        notice={notice ? <p className="form-error" role="alert">{notice}</p> : null}
      />
      <ConfirmModal
        isOpen={pendingPhotoFile !== null}
        title="Reemplazar fotografía"
        description="La fotografía nueva sustituirá la que ya está guardada."
        confirmLabel="Reemplazar"
        cancelLabel="Conservar actual"
        onConfirm={() => {
          const file = pendingPhotoFile;
          setPendingPhotoFile(null);
          if (file) void handlePhoto(file);
        }}
        onCancel={() => setPendingPhotoFile(null)}
        isDestructive={false}
      />
    </form>
  );
}
