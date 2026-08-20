export interface ScheduleDefinition {
    id: string
    name: string
    turnoNumber: number
    entryTime: string       // "HH:mm"
    exitTime: string        // "HH:mm"
    lunchMinutes: number    // expected lunch duration
    workDays: number[]      // 0=Sun..6=Sat
    lunchToleranceMinutes: number  // tolerancia comida
    toleranceMinutes: number
}

export interface PunchRow {
    numero_empleado: string
    nombre: string
    departamento: string
    area: string
    fecha: string                   // "YYYY-MM-DD"
    turno: number
    incidencia: string              // "A", "X", "D", "V", etc.
    entrada1: string | null         // entry to shift
    salida1: string | null          // exit to lunch
    entrada2: string | null         // return from lunch
    salida2: string | null          // exit from shift
    entrada3: string | null
    salida3: string | null
    entrada4: string | null
    salida4: string | null
    entrada5: string | null
    salida5: string | null
    observaciones: string
}

export type PunchStatus =
    | "on_time"
    | "late"
    | "missing_punch"
    | "no_schedule"
    | "day_off"
    | "incidence"

export interface PunchAnalysis {
    numero_empleado: string
    nombre: string
    departamento: string
    area: string
    fecha: string
    turno: number
    incidencia: string
    observaciones: string
    // raw punches
    entrada1: string | null
    salida1: string | null
    entrada2: string | null
    salida2: string | null
    // schedule
    hora_entrada_esperada: string
    hora_salida_esperada: string
    // computed
    status: PunchStatus
    minutos_trabajados: number
    minutos_comida: number
    exceso_comida: number  // minutos extra de comida (sobre lunchMinutes + tolerancia)
    minutos_retardo: number
    minutos_extra: number
    marcajes_faltantes: string[]    // which punches are missing
}

export interface RetardosSummary {
    total_empleados: number
    total_registros: number
    total_retardos: number
    total_faltas_marcaje: number
    total_minutos_extra: number
    total_minutos_trabajados: number
    promedio_comida_minutos: number
    pct_puntualidad: number
}

export interface EmployeeSummary {
    numero_empleado: string
    nombre: string
    turno: number
    total_dias: number
    dias_puntual: number
    dias_retardo: number
    dias_faltantes: number
    pct_puntualidad: number
    total_minutos_retardo: number
    total_minutos_extra: number
    total_minutos_trabajados: number
    promedio_comida_minutos: number
    registros: PunchAnalysis[]
}
