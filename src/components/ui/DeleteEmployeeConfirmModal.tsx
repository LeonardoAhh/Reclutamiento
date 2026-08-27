import { useEffect, useState } from "react";
import type { Employee } from "@/lib/types";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

interface DeleteEmployeeConfirmModalProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onConfirm: (
    num_empleado: string,
  ) => Promise<{ ok: boolean; message?: string }>;
}

export function DeleteEmployeeConfirmModal({
  isOpen,
  employee,
  onClose,
  onConfirm,
}: DeleteEmployeeConfirmModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSubmitting(false);
  }, [isOpen, employee]);

  if (!employee) return null;

  async function handleConfirm() {
    if (submitting || !employee) return;
    setErrorMsg(null);

    try {
      setSubmitting(true);
      const result = await onConfirm(employee.num_empleado);
      if (result.ok === false) {
        setErrorMsg(result.message ?? "No se pudo eliminar.");
        return;
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DeleteConfirmModal
      isOpen={isOpen}
      title="Eliminar empleado"
      onConfirm={() => void handleConfirm()}
      onCancel={onClose}
      isLoading={submitting}
      errorMessage={errorMsg ?? undefined}
    />
  );
}
