import { db } from '../db';
import { customFieldDefinitions } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface FieldDef {
  key: string;
  label: string;
  isLiteral?: boolean;
  isLoop?: boolean;
  loopOnly?: boolean;
}

export interface FieldGroup {
  id: string;
  label: string;
  color: string;
  fields: FieldDef[];
}

export async function getDataFieldGroups(category: string): Promise<FieldGroup[]> {
  if (category !== 'hr') {
    // For MBO, palette is hardcoded on the frontend
    return [];
  }

  // Load dynamic custom fields
  const cfDefs = await db.select().from(customFieldDefinitions).where(eq(customFieldDefinitions.isActive, true));

  const staticGroups: FieldGroup[] = [
    {
      id: 'anagrafica',
      label: 'Anagrafica',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      fields: [
        { key: 'nome', label: 'Nome' },
        { key: 'cognome', label: 'Cognome' },
        { key: 'nome_completo', label: 'Nome completo' },
        { key: 'codice_fiscale', label: 'Codice fiscale' },
        { key: 'matricola', label: 'Matricola' },
        { key: 'email', label: 'Email' },
        { key: 'telefono', label: 'Telefono' },
        { key: 'indirizzo', label: 'Indirizzo' },
        { key: 'cap', label: 'CAP' },
        { key: 'citta', label: 'Città' },
      ],
    },
    {
      id: 'organizzazione',
      label: 'Organizzazione',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      fields: [
        { key: 'department', label: 'Dipartimento' },
        { key: 'cdc', label: 'Centro di costo' },
        { key: 'area', label: 'Area' },
        { key: 'sotto_area', label: 'Sotto area' },
        { key: 'unita_organizzativa', label: 'Unità organizzativa' },
        { key: 'struttura_l1', label: 'Struttura L1' },
        { key: 'struttura_l2', label: 'Struttura L2' },
        { key: 'struttura_l3', label: 'Struttura L3' },
        { key: 'sede', label: 'Sede' },
        { key: 'sede_comune', label: 'Comune sede' },
        { key: 'sede_provincia', label: 'Provincia sede' },
      ],
    },
    {
      id: 'contratto',
      label: 'Contratto',
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      fields: [
        { key: 'data_assunzione', label: 'Data assunzione' },
        { key: 'qualifica', label: 'Qualifica' },
        { key: 'livello', label: 'Livello contrattuale' },
        { key: 'job_title', label: 'Job title' },
        { key: 'ccnl', label: 'CCNL' },
        { key: 'ral', label: 'RAL' },
        { key: 'mbo_percentuale', label: 'MBO %' },
      ],
    },
    {
      id: 'responsabile',
      label: 'Responsabile',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      fields: [
        { key: 'manager_nome', label: 'Nome responsabile' },
        { key: 'manager_cognome', label: 'Cognome responsabile' },
      ],
    },
    {
      id: 'documento',
      label: 'Documento & Firma',
      color: 'bg-green-100 text-green-800 border-green-200',
      fields: [
        { key: 'data_documento', label: 'Data documento (parametro)' },
        { key: 'data_oggi', label: 'Data di oggi (calcolato)' },
        { key: 'data_lunga', label: 'Data estesa it-IT (calcolato)' },
        { key: 'titolo', label: 'Titolo (Dottor/Dottoressa)' },
        { key: 'saluto_formula', label: 'Saluto formula' },
        { key: '[FIRMA]', label: 'Immagine firma (PNG)', isLiteral: true },
      ],
    },
  ];

  if (cfDefs.length > 0) {
    staticGroups.push({
      id: 'custom_fields',
      label: 'Campi personalizzati',
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      fields: cfDefs.map(d => ({
        key: `cf_${d.fieldName}`,
        label: d.fieldLabel,
      })),
    });
  }

  return staticGroups;
}
